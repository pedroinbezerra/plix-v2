"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Tv, Clock, Star } from "lucide-react";
import { SeasonSummary, EpisodeDetails } from "@/providers/metadata/types";
import { formatMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MediaContextMenu } from "./MediaContextMenu";

interface SeasonEpisodeSelectorProps {
  tmdbId: string;
  routeType: string;
  seasons: SeasonSummary[];
  initialEpisodes: EpisodeDetails[];
}

export function SeasonEpisodeSelector({
  tmdbId,
  routeType,
  seasons,
  initialEpisodes,
}: SeasonEpisodeSelectorProps) {
  const [activeSeason, setActiveSeason] = useState(
    seasons.length > 0 ? seasons[0].seasonNumber : 1
  );
  const [episodes, setEpisodes] = useState<EpisodeDetails[]>(initialEpisodes);
  const [loading, setLoading] = useState(false);

  const handleSelectSeason = async (seasonNum: number) => {
    if (seasonNum === activeSeason) return;
    setActiveSeason(seasonNum);
    setLoading(true);

    try {
      const res = await fetch(`/api/catalog/season?tmdbId=${tmdbId}&seasonNumber=${seasonNum}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.episodes)) {
          setEpisodes(data.episodes);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar episódios da temporada:", e);
    } finally {
      setLoading(false);
    }
  };

  const normalizedMediaType =
    routeType.toUpperCase() === "DESENHO" ? "ANIME" : routeType.toUpperCase();

  return (
    <div className="mt-10 sm:mt-14">
      {/* Seletor de Temporadas (Apple TV Capsule Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mb-7">
        {seasons.map((s) => {
          const isSelected = activeSeason === s.seasonNumber;
          return (
            <button
              key={s.seasonNumber}
              onClick={() => handleSelectSeason(s.seasonNumber)}
              className={cn(
                "px-5 py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex-shrink-0 border backdrop-blur-xl",
                isSelected
                  ? "bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
                  : "bg-white/[0.08] text-white/80 border-white/10 hover:bg-white/[0.16] hover:text-white"
              )}
            >
              {s.name || `Temporada ${s.seasonNumber}`}
            </button>
          );
        })}
      </div>

      {/* Lista de Episódios */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {episodes.map((ep) => {
            const playUrl = `/assistir/${routeType}/${tmdbId}?s=${ep.seasonNumber}&e=${ep.episodeNumber}`;

            return (
              <div
                key={ep.episodeNumber}
                data-card-wrapper="true"
                className="group relative flex flex-col rounded-2xl overflow-visible hover:z-30 focus-within:z-30 select-none"
              >
                <Link
                  href={playUrl}
                  tabIndex={0}
                  data-card-link="true"
                  data-media-id={String(tmdbId)}
                  className="flex flex-col flex-1 rounded-2xl overflow-hidden bg-surface-card border border-white/[0.08] hover:border-white/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,0.85)] focus-visible:scale-[1.04] focus-visible:shadow-tv focus-visible:border-white outline-none"
                >
                  {/* Thumbnail 16:9 */}
                  <div className="relative aspect-video w-full bg-surface-light overflow-hidden">
                    {ep.stillUrl ? (
                      <Image
                        src={ep.stillUrl}
                        alt={ep.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-light text-gray-500">
                        <Tv className="w-10 h-10" />
                      </div>
                    )}

                    {/* Play overlay on hover/focus estilo Apple TV */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl backdrop-blur-md transform translate-y-1 group-hover:translate-y-0 transition-transform">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </div>

                    {/* Número do episódio no canto superior esquerdo */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-semibold text-white pointer-events-none">
                      Ep. {ep.episodeNumber}
                    </div>

                    {/* Indicador de Tempo Total do Episódio (canto inferior esquerdo) */}
                    {ep.runtime > 0 && (
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 text-[11px] font-medium text-white/95 flex items-center gap-1 pointer-events-none shadow-sm">
                        <Clock className="w-3 h-3 text-white/70" />
                        <span>{formatMinutes(ep.runtime)}</span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo textual */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-surface-card">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-white/90 group-hover:text-white line-clamp-1 mb-1 tracking-tight">
                        {ep.episodeNumber}. {ep.name}
                      </h3>
                      <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                        {ep.overview || "Sem descrição disponível."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[11px]">
                      {ep.runtime > 0 ? (
                        <span className="flex items-center gap-1 text-white/60 font-medium">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span>{formatMinutes(ep.runtime)}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      {ep.voteAverage > 0 ? (
                        <div className="flex items-center gap-1 font-semibold text-amber-300">
                          <Star className="w-3 h-3 fill-amber-300" />
                          <span>{ep.voteAverage}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>

                {/* Menu de Três Pontinhos (•••) Padronizado no Episódio - Inferior Direito do Thumbnail */}
                <div className="absolute top-[calc(56.25%-2.5rem)] right-2.5 z-30">
                  <MediaContextMenu
                    media={{
                      id: tmdbId,
                      mediaType: normalizedMediaType,
                      title: `${ep.episodeNumber}. ${ep.name}`,
                      posterUrl: ep.stillUrl,
                      backdropUrl: ep.stillUrl,
                      seasonNumber: ep.seasonNumber,
                      episodeNumber: ep.episodeNumber,
                      runtime: ep.runtime,
                    }}
                    menuPosition="auto"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
