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
  Play,
  Pause,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { MediaType } from "@prisma/client";
import { cn, formatSeconds } from "@/lib/utils";

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
  runtime?: number;
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
  runtime = 0,
}: StreamingPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const rewind10BtnRef = useRef<HTMLButtonElement>(null);
  const forward10BtnRef = useRef<HTMLButtonElement>(null);
  const backBtnRef = useRef<HTMLAnchorElement>(null);

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Duração estimada inicial (em segundos): runtime do TMDB ou fallback inteligente
  const initialDuration = useMemo(() => {
    if (runtime && runtime > 0) return runtime * 60;
    return mediaType === "FILME" ? 7200 : 2700;
  }, [runtime, mediaType]);

  const [duration, setDuration] = useState<number>(initialDuration);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number>(0);
  const [seekFeedback, setSeekFeedback] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Provedor ativo e URLs dinâmicas para troca instantânea de servidor
  const [selectedProviderId, setSelectedProviderId] = useState<string>(initialProvider || "warez");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(streamUrl);
  const [activeAllowDirectives, setActiveAllowDirectives] = useState<string>(allowDirectives);

  const activeProvider = useMemo(() => {
    return providers?.find((p) => p.id === selectedProviderId);
  }, [providers, selectedProviderId]);

  const activeUseSandbox = activeProvider?.useSandbox ?? false;

  // Sincroniza com as props caso mudem externamente
  useEffect(() => {
    setActiveStreamUrl(streamUrl);
    setActiveAllowDirectives(allowDirectives);
    if (initialProvider) {
      setSelectedProviderId(initialProvider);
    }
  }, [streamUrl, allowDirectives, initialProvider]);

  // Recupera progresso salvo e preferência de provedor
  useEffect(() => {
    let isMounted = true;

    // Busca histórico prévio para restaurar a posição salva
    fetch("/api/user/history")
      .then((res) => (res.ok ? res.json() : null))
      .then((history) => {
        if (!isMounted || !Array.isArray(history)) return;
        const matched = history.find(
          (h: any) =>
            String(h.tmdbId) === String(tmdbId) &&
            h.mediaType === mediaType &&
            (seasonNumber !== undefined ? h.seasonNumber === seasonNumber && h.episodeNumber === episodeNumber : true)
        );

        if (matched && typeof matched.progressPercent === "number" && matched.progressPercent > 0) {
          const savedSec = Math.round((matched.progressPercent / 100) * initialDuration);
          setCurrentTime(savedSec);
          if (matched.isCompleted) setIsCompleted(true);
        }
      })
      .catch(() => {});

    // Recupera provedor salvo
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

    return () => {
      isMounted = false;
    };
  }, [providers, tmdbId, mediaType, seasonNumber, episodeNumber, initialDuration]);

  // Atualiza tempo de reprodução decorrido
  useEffect(() => {
    if (!isPlaying || isScrubbing) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) return duration;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isScrubbing, duration]);

  // Envia comandos de controle para o iframe do player
  const sendIframeCommand = useCallback((command: "seek" | "play" | "pause", value?: number) => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      if (command === "seek" && typeof value === "number") {
        const targetSeconds = Math.round(value);
        iframe.contentWindow.postMessage({ type: "streambetter:seek", time: targetSeconds }, "*");
        iframe.contentWindow.postMessage({ type: "seek", time: targetSeconds }, "*");
        iframe.contentWindow.postMessage({ action: "seek", value: targetSeconds }, "*");
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [targetSeconds, true] }),
          "*"
        );
        iframe.contentWindow.postMessage(`seek:${targetSeconds}`, "*");
      } else if (command === "play") {
        iframe.contentWindow.postMessage({ type: "streambetter:play" }, "*");
        iframe.contentWindow.postMessage({ type: "play" }, "*");
        iframe.contentWindow.postMessage({ action: "play" }, "*");
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo" }),
          "*"
        );
      } else if (command === "pause") {
        iframe.contentWindow.postMessage({ type: "streambetter:pause" }, "*");
        iframe.contentWindow.postMessage({ type: "pause" }, "*");
        iframe.contentWindow.postMessage({ action: "pause" }, "*");
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo" }),
          "*"
        );
      }
    } catch {
      // Ignora erro cross-origin
    }
  }, []);

  // Salva progresso no backend
  const saveProgress = useCallback(
    (seconds: number, completed = false) => {
      const pct = Math.min(100, Math.max(0, Math.round((seconds / duration) * 100)));
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
          progressPercent: pct,
        }),
      })
        .then(() => {
          window.dispatchEvent(new CustomEvent("plix:data-updated"));
        })
        .catch(() => {});
    },
    [duration, tmdbId, mediaType, seasonNumber, episodeNumber, title, posterUrl]
  );

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

  // Listener para mensagens de progresso do StreamBetter
  useEffect(() => {
    const handleProgressMessage = (event: MessageEvent) => {
      if (event.origin !== "https://streambetter.shop") return;
      if (event.data?.type !== "streambetter:progress") return;

      const { state, currentTime: remoteCurrent, duration: remoteDuration } = event.data;

      if (typeof remoteDuration === "number" && remoteDuration > 0) {
        setDuration(remoteDuration);
      }

      if (typeof remoteCurrent === "number" && !isScrubbing) {
        setCurrentTime(remoteCurrent);
      }

      if (state === "ended" && !isCompleted) {
        setIsCompleted(true);
        saveProgress(remoteDuration || duration, true);
      } else if (state === "paused") {
        setIsPlaying(false);
      } else if (state === "playing") {
        setIsPlaying(true);
      }
    };

    window.addEventListener("message", handleProgressMessage);
    return () => window.removeEventListener("message", handleProgressMessage);
  }, [isCompleted, isScrubbing, duration, saveProgress]);

  // Registra início da reprodução no histórico
  useEffect(() => {
    saveProgress(0, false);
  }, [saveProgress]);

  // Controle de exibição dos controles (auto-hide)
  const resetControlTimer = useCallback(() => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isScrubbing) {
        setShowControls(false);
      }
    }, 4500);
  }, [isScrubbing]);

  // Confirmação do seek na barra de progresso
  const commitSeek = useCallback(
    (targetSeconds: number) => {
      const safeTime = Math.min(duration, Math.max(0, targetSeconds));
      setCurrentTime(safeTime);
      setIsScrubbing(false);
      sendIframeCommand("seek", safeTime);
      saveProgress(safeTime, false);

      setSeekFeedback(`Continuando em ${formatSeconds(safeTime)}`);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setSeekFeedback(null), 2500);

      resetControlTimer();
    },
    [duration, sendIframeCommand, saveProgress, resetControlTimer]
  );

  // Play / Pause toggle
  const togglePlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    sendIframeCommand(nextState ? "play" : "pause");
    resetControlTimer();
  };

  // Pular 10s para frente / trás
  const handleSkipTime = (deltaSeconds: number) => {
    const nextTime = Math.min(duration, Math.max(0, currentTime + deltaSeconds));
    commitSeek(nextTime);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Alternar marcação de assistido
  const toggleCompleted = () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    saveProgress(currentTime, nextState);
  };

  // Previne que o iframe roube o foco do teclado
  useEffect(() => {
    const handleWindowBlur = () => {
      setTimeout(() => {
        if (document.activeElement === iframeRef.current) {
          progressBarRef.current?.focus();
        }
      }, 50);
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, []);

  // 3. Suporte Completo a D-pad (Controle Remoto de Smart TV)
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

      const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
      const isSelect = key === "Enter" || keyCode === 13 || key === " ";

      // Tecla Voltar do controle
      if (isBackKey) {
        e.preventDefault();
        e.stopPropagation();

        // Se estiver no modo de ajuste de timeline (scrubbing), primeiro cancela o ajuste
        if (isScrubbing) {
          setIsScrubbing(false);
          return;
        }

        // Se os controles estiverem abertos, fecha-os primeiro
        if (showControls) {
          setShowControls(false);
          return;
        }

        // Se já estiver sem controles ou voltar novamente, retorna para os detalhes
        router.push(backUrl);
        router.refresh();
        return;
      }

      // Se os controles estiverem ocultos, qualquer tecla direcional ou OK desperta os controles sem alterar volume ou pular
      if (!showControls && (isArrow || isSelect)) {
        e.preventDefault();
        e.stopPropagation();
        resetControlTimer();
        // Foca diretamente na barra de progresso
        progressBarRef.current?.focus();
        return;
      }

      // Se os controles estão visíveis, renova o temporizador
      if (isArrow || isSelect) {
        resetControlTimer();
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isProgressFocused =
        activeEl === progressBarRef.current || activeEl?.hasAttribute("data-player-progress");

      // 3.1. Navegação quando a Barra de Progresso está selecionada
      if (isProgressFocused) {
        // Seta para CIMA: sobe para o botão Play/Pause
        if (key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          if (isScrubbing) setIsScrubbing(false);
          playBtnRef.current?.focus();
          return;
        }

        // Seta para ESQUERDA: recua o marcador de tempo na barra
        if (key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          const baseTime = isScrubbing ? scrubTime : currentTime;
          const nextTime = Math.max(0, baseTime - 15);
          setIsScrubbing(true);
          setScrubTime(nextTime);
          return;
        }

        // Seta para DIREITA: avança o marcador de tempo na barra
        if (key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          const baseTime = isScrubbing ? scrubTime : currentTime;
          const nextTime = Math.min(duration, baseTime + 15);
          setIsScrubbing(true);
          setScrubTime(nextTime);
          return;
        }

        // OK / Enter na barra de progresso:
        if (isSelect) {
          e.preventDefault();
          e.stopPropagation();
          if (isScrubbing) {
            // Aplica a posição selecionada e retoma a reprodução a partir dali!
            commitSeek(scrubTime);
          } else {
            // Entra no modo de ajuste
            setIsScrubbing(true);
            setScrubTime(currentTime);
          }
          return;
        }
      }

      // 3.2. Navegação quando um dos botões do meio (Voltar 10s, Play, Avançar 10s) está focado
      const isPlayOrSkipFocused =
        activeEl === playBtnRef.current ||
        activeEl === rewind10BtnRef.current ||
        activeEl === forward10BtnRef.current;

      if (isPlayOrSkipFocused) {
        // Seta para BAIXO: desce diretamente para a Barra de Progresso
        if (key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          progressBarRef.current?.focus();
          return;
        }

        // Seta para CIMA: sobe para o topo (botão Voltar ou servidor)
        if (key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          backBtnRef.current?.focus();
          return;
        }

        // Seta para ESQUERDA / DIREITA entre os botões do meio
        if (key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          if (activeEl === forward10BtnRef.current) playBtnRef.current?.focus();
          else if (activeEl === playBtnRef.current) rewind10BtnRef.current?.focus();
          return;
        }

        if (key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          if (activeEl === rewind10BtnRef.current) playBtnRef.current?.focus();
          else if (activeEl === playBtnRef.current) forward10BtnRef.current?.focus();
          return;
        }
      }

      // 3.3. Navegação a partir da barra de topo (Voltar, Servidores, etc.)
      const isTopBarFocused = activeEl?.closest("[data-top-bar]");
      if (isTopBarFocused) {
        if (key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          playBtnRef.current?.focus();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleRemoteKey, true);
    return () => window.removeEventListener("keydown", handleRemoteKey, true);
  }, [
    showControls,
    isScrubbing,
    scrubTime,
    currentTime,
    duration,
    backUrl,
    commitSeek,
    resetControlTimer,
    router,
  ]);

  // Foco inicial suave na barra de progresso ou play ao abrir
  useEffect(() => {
    const timer = setTimeout(() => {
      playBtnRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Manipulador de clique na barra de progresso via mouse ou toque
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, clickX / rect.width));
    const targetSeconds = pct * duration;
    commitSeek(targetSeconds);
  };

  const displayedTime = isScrubbing ? scrubTime : currentTime;
  const progressRatio = Math.min(100, Math.max(0, (displayedTime / (duration || 1)) * 100));

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlTimer}
      onClick={resetControlTimer}
      className="fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden select-none"
    >
      {/* 1. Barra Flutuante de Topo (Glass UI) */}
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

      {/* 2. Controles Centrais de Reprodução (Play/Pause e Pulos de 10s) */}
      <div
        className={cn(
          "absolute inset-0 z-30 flex items-center justify-center gap-6 sm:gap-10 pointer-events-none transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Voltar 10s */}
        <button
          ref={rewind10BtnRef}
          type="button"
          onClick={() => handleSkipTime(-10)}
          className="p-4 sm:p-5 rounded-full bg-black/60 hover:bg-white/20 active:scale-90 text-white transition-all backdrop-blur-xl border border-white/20 shadow-2xl pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:scale-110"
          aria-label="Voltar 10 segundos"
        >
          <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Play / Pause Principal */}
        <button
          ref={playBtnRef}
          type="button"
          onClick={togglePlayPause}
          className="p-5 sm:p-7 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black focus-visible:scale-115"
          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-black" />
          ) : (
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black ml-1" />
          )}
        </button>

        {/* Avançar 10s */}
        <button
          ref={forward10BtnRef}
          type="button"
          onClick={() => handleSkipTime(10)}
          className="p-4 sm:p-5 rounded-full bg-black/60 hover:bg-white/20 active:scale-90 text-white transition-all backdrop-blur-xl border border-white/20 shadow-2xl pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:scale-110"
          aria-label="Avançar 10 segundos"
        >
          <RotateCw className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Toast de Feedback de Posição Selecionada */}
      {seekFeedback && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-xl border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
          <Play className="w-3.5 h-3.5 fill-white text-white" />
          <span>{seekFeedback}</span>
        </div>
      )}

      {/* 3. Barra de Progresso e Linha do Tempo Inferior (Timeline) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-40 p-4 sm:p-8 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 pointer-events-auto",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-2">
          {/* Marcadores de Tempo e Dica de Navegação */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-white/90 drop-shadow">
            <span className="font-mono bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10">
              {formatSeconds(displayedTime)}
            </span>

            {isScrubbing ? (
              <span className="px-4 py-1 rounded-full bg-white text-black font-bold text-xs sm:text-[13px] animate-pulse shadow-xl flex items-center gap-1.5">
                <span>◀ Ajuste com setas • Pressione OK para continuar ▶</span>
              </span>
            ) : (
              <span className="hidden sm:inline text-xs text-white/50 font-medium">
                Selecione a barra com setas e use Esquerda/Direita para navegar
              </span>
            )}

            <span className="font-mono bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 text-white/70">
              {formatSeconds(duration)}
            </span>
          </div>

          {/* Barra de Progresso Interativa com Scrubber Thumb */}
          <div
            ref={progressBarRef}
            tabIndex={0}
            role="slider"
            aria-label="Barra de progresso do vídeo"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={displayedTime}
            data-player-progress="true"
            data-player-scrubbing={isScrubbing ? "true" : "false"}
            onClick={handleProgressBarClick}
            className={cn(
              "relative w-full h-3 sm:h-3.5 rounded-full cursor-pointer transition-all duration-200 bg-white/20 backdrop-blur-md overflow-visible outline-none group",
              "focus:outline-none focus-visible:h-4 sm:focus-visible:h-4.5 focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:shadow-[0_0_30px_rgba(255,255,255,0.9)]"
            )}
          >
            {/* Linha de preenchimento de progresso */}
            <div
              className="absolute top-0 left-0 bottom-0 rounded-full bg-gradient-to-r from-red-600 via-primary to-white transition-all duration-150"
              style={{ width: `${progressRatio}%` }}
            />

            {/* Marcador Scrubber Thumb */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] border-2 border-primary transition-all pointer-events-none",
                isScrubbing
                  ? "scale-150 ring-4 ring-white ring-offset-2 ring-offset-black animate-pulse"
                  : "group-hover:scale-125 group-focus-visible:scale-125"
              )}
              style={{ left: `${progressRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Escudo transparente sobre o iframe para capturar interações e evitar roubo de foco */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-colors duration-200",
          showControls ? "bg-black/30 pointer-events-auto" : "pointer-events-none"
        )}
        onClick={resetControlTimer}
      />

      {/* 5. Iframe Direto do Player com Sandbox Condicional */}
      <iframe
        ref={iframeRef}
        key={`${selectedProviderId}-${activeStreamUrl}`}
        src={activeStreamUrl}
        tabIndex={-1}
        className="w-full h-full border-0 absolute inset-0 z-0 pointer-events-auto"
        allow={activeAllowDirectives}
        {...(activeUseSandbox ? { sandbox: "allow-scripts allow-same-origin allow-forms" } : {})}
        allowFullScreen
        title={`Reprodução de ${title}`}
      />
    </div>
  );
}
