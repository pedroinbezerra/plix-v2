"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { formatMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  media?: EnrichedMedia;
  items?: EnrichedMedia[];
}

export function HeroBanner({ media, items }: HeroBannerProps) {
  // Constrói lista de candidatos para o carrossel Apple TV
  const carouselItems = items && items.length > 0 ? items : media ? [media] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Rotação automática a cada 8 segundos estilo Apple TV Featured Shelf
  useEffect(() => {
    if (carouselItems.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [carouselItems.length, isPaused]);

  const activeMedia = carouselItems[currentIndex];

  // Sincroniza status na lista para o item atual
  useEffect(() => {
    if (!activeMedia) return;
    let isCancelled = false;

    fetch(`/api/user/watchlist?tmdbId=${encodeURIComponent(activeMedia.id)}&mediaType=${encodeURIComponent(activeMedia.mediaType)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data) {
          setInWatchlist(!!data.inWatchlist);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [activeMedia?.id, activeMedia?.mediaType]);

  if (!activeMedia) {
    return null;
  }

  const routeType = activeMedia.mediaType.toLowerCase();
  const watchHref = `/assistir/${routeType}/${activeMedia.id}`;
  const detailsHref = `/detalhes/${routeType}/${activeMedia.id}`;

  const typeLabels: Record<string, string> = {
    FILME: "Filme",
    SERIE: "Série",
    ANIME: "Anime",
    DORAMA: "Dorama",
  };

  const handleToggleWatchlist = async () => {
    if (watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      const res = await fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: activeMedia.id,
          mediaType: activeMedia.mediaType,
          title: activeMedia.title,
          posterUrl: activeMedia.posterUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInWatchlist(!!data.inWatchlist);
        window.dispatchEvent(new CustomEvent("plix:data-updated"));
      }
    } catch (e) {
      console.error("Erro ao alterar Minha Lista:", e);
    } finally {
      setWatchlistLoading(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[76vh] sm:h-[84vh] min-h-[540px] max-h-[820px] overflow-hidden select-none bg-background"
    >
      {/* Imagem de backdrop com transição suave */}
      <div key={activeMedia.id} className="absolute inset-0 transition-opacity duration-1000">
        {activeMedia.backdropUrl ? (
          <Image
            src={activeMedia.backdropUrl}
            alt={activeMedia.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.8] transform scale-105 transition-transform duration-10000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface to-background" />
        )}
      </div>

      {/* Gradientes cinematográficos Apple TV (dissolução radial e vertical profunda) */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-transparent w-full md:w-3/4" />

      {/* Conteúdo textual e botões de ação */}
      <div className="absolute bottom-16 sm:bottom-20 left-4 sm:left-12 max-w-2xl z-20">
        {/* Metadados rápidos estilo Apple TV (sem badges de resolução) */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
          <span className="px-3 py-0.5 rounded-full bg-white/10 text-white border border-white/15 text-[11px] font-semibold tracking-wider uppercase shadow-sm">
            {typeLabels[activeMedia.mediaType] || activeMedia.mediaType}
          </span>

          {activeMedia.voteAverage > 0 && (
            <div className="flex items-center gap-1 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>{activeMedia.voteAverage.toFixed(1)}</span>
            </div>
          )}

          {activeMedia.releaseYear && (
            <span className="text-xs text-white/80 font-medium">
              {activeMedia.releaseYear}
            </span>
          )}

          {activeMedia.runtime > 0 && (
            <span className="text-xs text-white/70 font-medium">
              • {formatMinutes(activeMedia.runtime)}
            </span>
          )}
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl mb-3.5 line-clamp-2">
          {activeMedia.title}
        </h1>

        {/* Sinopse */}
        <p className="text-sm sm:text-base text-white/85 line-clamp-2 sm:line-clamp-3 mb-6 leading-relaxed max-w-xl drop-shadow">
          {activeMedia.overview}
        </p>

        {/* Botões de Ação estilo Apple TV */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <Link
            href={watchHref}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black font-bold text-sm sm:text-base transition-all shadow-xl cursor-pointer"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black ml-0.5" />
            <span>{activeMedia.mediaType === "FILME" ? "Reproduzir filme" : "Reproduzir primeiro episódio"}</span>
          </Link>

          {/* Botão circular de Minha Lista (+) */}
          <button
            onClick={handleToggleWatchlist}
            disabled={watchlistLoading}
            className={cn(
              "w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95",
              inWatchlist
                ? "bg-white text-black border-white shadow-lg"
                : "bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-md"
            )}
            title={inWatchlist ? "Remover da lista Quero Assistir" : "Adicionar à lista Quero Assistir"}
            aria-label="Minha Lista"
          >
            {inWatchlist ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
          </button>

          <Link
            href={detailsHref}
            className="flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium text-sm sm:text-base border border-white/15 transition-all cursor-pointer backdrop-blur-md"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Mais Informações</span>
          </Link>
        </div>
      </div>

      {/* Elenco no canto inferior direito estilo Apple TV */}
      {activeMedia.cast && activeMedia.cast.length > 0 && (
        <div className="hidden lg:block absolute bottom-18 right-8 sm:right-12 z-20 text-xs text-white/60 max-w-xs text-right leading-relaxed">
          Estrelando <span className="text-white/90 font-medium">{activeMedia.cast.slice(0, 3).join(", ")}</span>
        </div>
      )}

      {/* Indicadores de Paginação do Carrossel Apple TV (Pill Bars) */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-5 right-4 sm:right-12 z-20 flex items-center gap-2 sm:gap-3 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
            }
            aria-label="Item anterior"
            className="p-1 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {carouselItems.slice(0, 6).map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300 cursor-pointer overflow-hidden",
                    isActive ? "w-7 sm:w-9 bg-white shadow-sm" : "w-2.5 sm:w-3 bg-white/30 hover:bg-white/50"
                  )}
                />
              );
            })}
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % carouselItems.length)}
            aria-label="Próximo item"
            className="p-1 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
