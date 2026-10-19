"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  SkipForward,
  Maximize,
  Minimize,
  Server,
} from "lucide-react";
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { isPopupBlockerEnabled, POPUP_BLOCKER_KEY } from "@/components/security/AdBlockerGuard";

export interface StreamingProviderOption {
  id: string;
  name: string;
  streamUrl: string;
  allowDirectives?: string;
  useSandbox?: boolean;
}

interface StreamingPlayerProps {
  streamUrl: string;
  allowDirectives: string;
  title: string;
  mediaType: MediaType;
  tmdbId: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName?: string;
  nextEpisodeUrl?: string | null;
  backUrl: string;
  posterUrl?: string | null;
  providers?: StreamingProviderOption[];
  initialProvider?: string;
  initialPopupBlocker?: boolean;
}

export function StreamingPlayer({
  streamUrl,
  allowDirectives,
  title,
  mediaType,
  tmdbId,
  seasonNumber,
  episodeNumber,
  episodeName,
  nextEpisodeUrl,
  backUrl,
  posterUrl,
  providers,
  initialProvider,
  initialPopupBlocker = true,
}: StreamingPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLAnchorElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [popupBlockerEnabled, setPopupBlockerEnabled] = useState<boolean>(initialPopupBlocker);

  // Provedor ativo e URLs dinâmicas para troca instantânea de servidor
  const [selectedProviderId, setSelectedProviderId] = useState<string>(initialProvider || "warez");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(streamUrl);
  const [activeAllowDirectives, setActiveAllowDirectives] = useState<string>(allowDirectives);

  const activeProvider = useMemo(() => {
    return providers?.find((p) => p.id === selectedProviderId);
  }, [providers, selectedProviderId]);

  const shouldUseSandbox = Boolean(activeProvider?.useSandbox && popupBlockerEnabled);

  // Sincroniza com as props caso mudem externamente
  useEffect(() => {
    setActiveStreamUrl(streamUrl);
    setActiveAllowDirectives(allowDirectives);
    if (initialProvider) {
      setSelectedProviderId(initialProvider);
    }
  }, [streamUrl, allowDirectives, initialProvider]);

  // Sincroniza estado do bloqueador de popups configurado no perfil
  useEffect(() => {
    if (typeof window === "undefined") return;

    setPopupBlockerEnabled(isPopupBlockerEnabled());

    const handleBlockerChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setPopupBlockerEnabled(customEvent.detail.enabled);
      } else {
        setPopupBlockerEnabled(isPopupBlockerEnabled());
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === POPUP_BLOCKER_KEY) {
        setPopupBlockerEnabled(event.newValue !== "false");
      }
    };

    window.addEventListener("plix:popup-blocker-changed", handleBlockerChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("plix:popup-blocker-changed", handleBlockerChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Recupera preferência de provedor salva localmente
  useEffect(() => {
    if (typeof window !== "undefined" && providers && providers.length > 0) {
      const saved = localStorage.getItem("plix_player_provider");
      const urlParam = new URLSearchParams(window.location.search).get("player");
      if (!urlParam && saved && saved !== selectedProviderId) {
        const found = providers.find((p) => p.id === saved);
        if (found) {
          setSelectedProviderId(saved);
          setActiveStreamUrl(found.streamUrl);
          if (found.allowDirectives) setActiveAllowDirectives(found.allowDirectives);
        }
      }
    }
  }, [providers, selectedProviderId]);

  // Salva histórico de reprodução no backend
  const saveHistory = useCallback(
    (completed = false) => {
      fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId,
          mediaType,
          seasonNumber: seasonNumber ?? 0,
          episodeNumber: episodeNumber ?? 0,
          isCompleted: completed,
          title,
          posterUrl,
        }),
      })
        .then(() => {
          window.dispatchEvent(new CustomEvent("plix:data-updated"));
        })
        .catch(() => {});
    },
    [tmdbId, mediaType, seasonNumber, episodeNumber, title, posterUrl]
  );

  // Registra início da reprodução no histórico
  useEffect(() => {
    saveHistory(false);
  }, [saveHistory]);

  // Listener para conclusão automática do StreamBetter (quando disponível)
  useEffect(() => {
    const handleProgressMessage = (event: MessageEvent) => {
      if (event.origin !== "https://streambetter.shop") return;
      if (event.data?.type !== "streambetter:progress") return;

      if (event.data.state === "ended" && !isCompleted) {
        setIsCompleted(true);
        saveHistory(true);
      }
    };

    window.addEventListener("message", handleProgressMessage);
    return () => window.removeEventListener("message", handleProgressMessage);
  }, [isCompleted, saveHistory]);

  // Manipulador de troca de provedor
  const handleSelectProvider = (providerId: string) => {
    if (providerId === selectedProviderId) return;
    setSelectedProviderId(providerId);

    const target = providers?.find((p) => p.id === providerId);
    if (target) {
      setActiveStreamUrl(target.streamUrl);
      if (target.allowDirectives) {
        setActiveAllowDirectives(target.allowDirectives);
      }
    }

    try {
      localStorage.setItem("plix_player_provider", providerId);
      document.cookie = `plix_player_provider=${providerId}; path=/; max-age=31536000; SameSite=Lax`;

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("player", providerId);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      // Ignora
    }
  };

  // URL do próximo episódio
  const computedNextEpisodeUrl = useMemo(() => {
    if (!nextEpisodeUrl) return null;
    try {
      const url = new URL(nextEpisodeUrl, "https://plix.local");
      if (selectedProviderId) {
        url.searchParams.set("player", selectedProviderId);
      }
      return `${url.pathname}${url.search}`;
    } catch {
      return nextEpisodeUrl;
    }
  }, [nextEpisodeUrl, selectedProviderId]);

  // Controle de exibição da barra superior (auto-hide)
  const resetControlTimer = useCallback(() => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    resetControlTimer();
    const handleActivity = () => resetControlTimer();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [resetControlTimer]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Alternar marcação de assistido
  const toggleCompleted = () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    saveHistory(nextState);
  };

  // Suporte a tecla Voltar (Smart TV / Teclado)
  useEffect(() => {
    const handleRemoteKey = (e: KeyboardEvent) => {
      const { key, keyCode } = e;

      const isBackKey =
        key === "Escape" ||
        key === "Backspace" ||
        key === "GoBack" ||
        keyCode === 10009 || // Samsung Tizen Return
        keyCode === 461 ||   // LG webOS Back
        keyCode === 4;       // Android TV Back

      if (isBackKey) {
        e.preventDefault();
        router.push(backUrl);
        router.refresh();
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(key)) {
        resetControlTimer();
      }
    };

    window.addEventListener("keydown", handleRemoteKey);
    return () => window.removeEventListener("keydown", handleRemoteKey);
  }, [backUrl, router, resetControlTimer]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlTimer}
      className="fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden select-none"
    >
      {/* Barra Flutuante de Topo (Navegação e Seleção de Servidor) */}
      <div
        data-top-bar="true"
        className={cn(
          "absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex flex-wrap items-center justify-between gap-3 transition-opacity duration-300 pointer-events-auto",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Esquerda: Botão Voltar + Título do Conteúdo */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            ref={backBtnRef}
            href={backUrl}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all backdrop-blur-md border border-white/15 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md lg:max-w-lg">
              {title}
            </h1>
            {seasonNumber && episodeNumber ? (
              <p className="text-xs sm:text-sm text-gray-300 truncate max-w-xs sm:max-w-md">
                Temporada {seasonNumber} • Episódio {episodeNumber}
                {episodeName ? ` — ${episodeName}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {/* Direita: Servidores + Ações */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Seletor de Servidor / Provedor */}
          {providers && providers.length > 1 && (
            <div
              className="flex items-center bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/15 shadow-lg"
              role="radiogroup"
              aria-label="Selecionar servidor de vídeo"
            >
              <div className="hidden md:flex items-center gap-1 pl-2.5 pr-1 text-[11px] font-medium text-gray-400">
                <Server className="w-3.5 h-3.5 text-gray-400" />
                <span>Servidor:</span>
              </div>
              {providers.map((p) => {
                const isSelected = p.id === selectedProviderId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProvider(p.id)}
                    role="radio"
                    aria-checked={isSelected}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      isSelected
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    )}
                    title={`Mudar para o servidor ${p.name}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Botão de Marcar como Assistido */}
          <button
            onClick={toggleCompleted}
            className={cn(
              "flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all backdrop-blur-md border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white outline-none",
              isCompleted
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                : "bg-white/10 text-white border-white/15 hover:bg-white/20"
            )}
            title="Marcar como concluído/assistido"
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Assistido</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span className="hidden sm:inline">Marcar Assistido</span>
              </>
            )}
          </button>

          {/* Botão de Próximo Episódio (se disponível) */}
          {computedNextEpisodeUrl && (
            <Link
              href={computedNextEpisodeUrl}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-xs sm:text-sm font-bold transition-all shadow-xl cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 outline-none"
              title="Avançar para o próximo episódio"
            >
              <span className="hidden sm:inline">Próximo</span>
              <SkipForward className="w-4 h-4 fill-black" />
            </Link>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/15 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white outline-none"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Player Integrado do Provedor com Sandbox Condicional (controlado pelo Bloqueador de Popups) */}
      <iframe
        key={`${selectedProviderId}-${activeStreamUrl}-${shouldUseSandbox ? "sandboxed" : "unsandboxed"}`}
        src={activeStreamUrl}
        className="w-full h-full border-0 absolute inset-0 z-0"
        allow={activeAllowDirectives}
        {...(shouldUseSandbox ? { sandbox: "allow-scripts allow-same-origin allow-forms" } : {})}
        allowFullScreen
        title={`Reprodução de ${title}`}
      />
    </div>
  );
}
