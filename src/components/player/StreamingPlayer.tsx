"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, SkipForward, Maximize, Minimize } from "lucide-react";
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils";

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
}: StreamingPlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Registra início da reprodução no histórico do usuário
  useEffect(() => {
    fetch("/api/user/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId,
        mediaType,
        seasonNumber,
        episodeNumber,
        isCompleted: false,
        title,
        posterUrl,
      }),
    })
      .then(() => {
        window.dispatchEvent(new CustomEvent("plix:data-updated"));
      })
      .catch((e) => console.warn("Erro ao registrar início do histórico:", e));
  }, [tmdbId, mediaType, seasonNumber, episodeNumber, title, posterUrl]);

  // 2. Temporizador para ocultar controles flutuantes
  const resetControlTimer = () => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    resetControlTimer();
    const handleActivity = () => resetControlTimer();

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  // 3. Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 4. Alternar marcação de assistido
  const toggleCompleted = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);

    try {
      await fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId,
          mediaType,
          seasonNumber,
          episodeNumber,
          isCompleted: nextState,
          title,
          posterUrl,
        }),
      });
      window.dispatchEvent(new CustomEvent("plix:data-updated"));
      router.refresh();
    } catch (e) {
      console.warn("Erro ao atualizar status de assistido:", e);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(backUrl);
    router.refresh();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden select-none"
    >
      {/* Top Floating Control Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-auto",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Esquerda: Botão Voltar + Título do Conteúdo */}
        <div className="flex items-center gap-4">
          <Link
            href={backUrl}
            onClick={handleBack}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all backdrop-blur-md border border-white/10 cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <h1 className="text-base sm:text-xl font-bold text-white tracking-wide truncate max-w-sm sm:max-w-xl">
              {title}
            </h1>
            {seasonNumber && episodeNumber ? (
              <p className="text-xs sm:text-sm text-gray-300">
                Temporada {seasonNumber} • Episódio {episodeNumber}
                {episodeName ? ` — ${episodeName}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {/* Direita: Ações (Próximo Episódio, Marcar Assistido, Fullscreen) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Marcar como Assistido */}
          <button
            onClick={toggleCompleted}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all backdrop-blur-md border cursor-pointer",
              isCompleted
                ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50"
                : "bg-white/10 text-gray-200 border-white/10 hover:bg-white/20"
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
          {nextEpisodeUrl && (
            <Link
              href={nextEpisodeUrl}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-primary/30 cursor-pointer"
              title="Avançar para o próximo episódio"
            >
              <span className="hidden sm:inline">Próximo</span>
              <SkipForward className="w-4 h-4 fill-white" />
            </Link>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10 cursor-pointer"
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

      {/* Iframe Direto do Player Externo */}
      <iframe
        src={streamUrl}
        className="w-full h-full border-0 absolute inset-0"
        allow={allowDirectives}
        allowFullScreen
        title={`Reprodução de ${title}`}
      />
    </div>
  );
}
