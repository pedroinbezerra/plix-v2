"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Tv, Clock, Star } from "lucide-react";
import { SeasonSummary, EpisodeDetails } from "@/providers/metadata/types";
import { formatMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

  return (
    <div className="mt-10 sm:mt-14">
      {/* Seletor de Temporadas (Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto plix-scrollbar pb-3 mb-6">
        {seasons.map((s) => {
          const isSelected = activeSeason === s.seasonNumber;
          return (
            <button
              key={s.seasonNumber}
              onClick={() => handleSelectSeason(s.seasonNumber)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer flex-shrink-0 border",
                isSelected
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                  : "bg-surface-light/80 text-gray-300 border-white/5 hover:bg-surface-hover hover:text-white"
              )}
            >
              {s.name || `Temporada ${s.seasonNumber}`}
            </button>
          );
        })}
      </div>

      {/* Lista de Episódios */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {episodes.map((ep) => {
            const playUrl = `/assistir/${routeType}/${tmdbId}?s=${ep.seasonNumber}&e=${ep.episodeNumber}`;

            return (
              <Link
                key={ep.episodeNumber}
                href={playUrl}
                tabIndex={0}
                className="group relative flex flex-col rounded-xl overflow-hidden bg-surface-card border border-white/5 hover:border-white/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/70 focus-visible:scale-[1.02] focus-visible:shadow-tv"
              >
                {/* Thumbnail 16:9 */}
                <div className="relative aspect-video w-full bg-surface-light overflow-hidden">
                  {ep.stillUrl ? (
                    <Image
                      src={ep.stillUrl}
                      alt={ep.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-light text-gray-600">
                      <Tv className="w-10 h-10" />
                    </div>
                  )}

                  {/* Play overlay on hover/focus */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/50">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Número do episódio no canto superior */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-xs font-bold text-white">
                    Ep. {ep.episodeNumber}
                  </div>

                  {ep.runtime > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-medium text-gray-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatMinutes(ep.runtime)}</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo textual */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-100 group-hover:text-white line-clamp-1 mb-1">
                      {ep.episodeNumber}. {ep.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {ep.overview || "Sem descrição disponível."}
                    </p>
                  </div>

                  {ep.voteAverage > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 mt-2">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{ep.voteAverage}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
