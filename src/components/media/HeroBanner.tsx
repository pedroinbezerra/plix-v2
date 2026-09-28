"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
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

  // Rotação automática a cada 8 segundos estilo Apple TV Featured Shelf
  useEffect(() => {
    if (carouselItems.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [carouselItems.length, isPaused]);

  if (carouselItems.length === 0) {
    return null;
  }

  const activeMedia = carouselItems[currentIndex];
  const routeType = activeMedia.mediaType.toLowerCase();
  const watchHref = `/assistir/${routeType}/${activeMedia.id}`;
  const detailsHref = `/detalhes/${routeType}/${activeMedia.id}`;

  const typeLabels: Record<string, string> = {
    FILME: "Filme",
    SERIE: "Série",
    ANIME: "Anime",
    DORAMA: "Dorama",
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[70vh] sm:h-[82vh] min-h-[520px] max-h-[820px] overflow-hidden select-none bg-background"
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
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent w-full md:w-3/4" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/20 to-background/60" />

      {/* Conteúdo textual e botões de ação */}
      <div className="absolute bottom-14 sm:bottom-20 left-4 sm:left-12 max-w-2xl z-20">
        {/* Metadados rápidos estilo Apple TV chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="px-3 py-0.5 rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/15 text-[11px] font-semibold tracking-wider uppercase shadow-sm">
            {typeLabels[activeMedia.mediaType] || activeMedia.mediaType}
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/80 border border-white/10 text-[10px] font-bold tracking-wider uppercase">
            4K HDR
          </span>

          {activeMedia.voteAverage > 0 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-300">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span>{activeMedia.voteAverage}</span>
            </div>
          )}

          {activeMedia.releaseYear && (
            <span className="text-xs text-white/70 font-medium">
              {activeMedia.releaseYear}
            </span>
          )}

          {activeMedia.runtime > 0 && (
            <span className="text-xs text-white/50">
              • {formatMinutes(activeMedia.runtime)}
            </span>
          )}
        </div>

        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl mb-3.5 line-clamp-2">
          {activeMedia.title}
        </h1>

        {/* Sinopse */}
        <p className="text-sm sm:text-base text-white/80 line-clamp-3 mb-7 leading-relaxed max-w-xl drop-shadow">
          {activeMedia.overview}
        </p>

        {/* Botões de Ação estilo Apple TV (Pills arredondados) */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Link
            href={watchHref}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black font-semibold text-sm sm:text-base transition-all shadow-[0_12px_30px_rgba(255,255,255,0.25)] hover:shadow-[0_15px_35px_rgba(255,255,255,0.35)] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-black ml-0.5" />
            <span>Assistir</span>
          </Link>

          <Link
            href={detailsHref}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-medium text-sm sm:text-base backdrop-blur-2xl border border-white/20 transition-all cursor-pointer"
          >
            <Info className="w-5 h-5" />
            <span>Mais Informações</span>
          </Link>
        </div>
      </div>

      {/* Indicadores de Paginação do Carrossel Apple TV (Pill Bars) */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-6 right-4 sm:right-12 z-20 flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
            }
            aria-label="Item anterior"
            className="p-1 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {carouselItems.slice(0, 6).map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300 cursor-pointer overflow-hidden",
                    isActive ? "w-8 sm:w-10 bg-white shadow-sm" : "w-2.5 sm:w-3 bg-white/30 hover:bg-white/50"
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
