"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { formatMinutes } from "@/lib/utils";

interface HeroBannerProps {
  media: EnrichedMedia;
}

export function HeroBanner({ media }: HeroBannerProps) {
  const routeType = media.mediaType.toLowerCase();
  const watchHref = `/assistir/${routeType}/${media.id}`;
  const detailsHref = `/detalhes/${routeType}/${media.id}`;

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] min-h-[480px] max-h-[750px] overflow-hidden">
      {/* Imagem de backdrop */}
      {media.backdropUrl ? (
        <Image
          src={media.backdropUrl}
          alt={media.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transform scale-105 animate-fade-in"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-surface to-background" />
      )}

      {/* Gradientes cinematográficos */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent w-full md:w-3/4" />

      {/* Conteúdo textual e botões de ação */}
      <div className="absolute bottom-12 sm:bottom-16 left-4 sm:left-12 max-w-2xl z-20">
        {/* Metadados rápidos */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded bg-primary text-white text-xs font-bold uppercase tracking-wider shadow">
            {media.mediaType}
          </span>
          {media.voteAverage > 0 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{media.voteAverage}</span>
            </div>
          )}
          {media.releaseYear && (
            <span className="text-xs text-gray-300 font-medium">
              {media.releaseYear}
            </span>
          )}
          {media.runtime > 0 && (
            <span className="text-xs text-gray-400">
              • {formatMinutes(media.runtime)}
            </span>
          )}
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md mb-3 line-clamp-2">
          {media.title}
        </h1>

        {/* Sinopse */}
        <p className="text-sm sm:text-base text-gray-300 line-clamp-3 mb-6 leading-relaxed max-w-xl drop-shadow">
          {media.overview}
        </p>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={watchHref}
            className="flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl bg-white hover:bg-gray-200 active:scale-95 text-black font-bold text-sm sm:text-base transition-all shadow-xl shadow-black/50 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>Assistir</span>
          </Link>

          <Link
            href={detailsHref}
            className="flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white font-semibold text-sm sm:text-base backdrop-blur-md transition-all border border-white/20 cursor-pointer"
          >
            <Info className="w-5 h-5" />
            <span>Mais Informações</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
