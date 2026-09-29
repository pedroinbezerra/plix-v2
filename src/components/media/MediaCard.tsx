"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Film,
  Tv,
  Play,
  Clock,
} from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { cn, formatMediaDuration } from "@/lib/utils";
import { isJapaneseAnime } from "@/lib/media-classifier";
import { MediaContextMenu } from "./MediaContextMenu";

interface MediaCardProps {
  media: EnrichedMedia | {
    id: string;
    mediaType: "FILME" | "SERIE" | "ANIME" | "DORAMA";
    title: string;
    posterUrl: string | null;
    backdropUrl?: string | null;
    overview?: string;
    releaseYear?: string;
    voteAverage?: number;
    originCountry?: string[];
    originalLanguage?: string;
    isAnime?: boolean;
    seasonNumber?: number;
    episodeNumber?: number;
    progressPercent?: number;
    runtime?: number;
    seasonsCount?: number;
    episodesCount?: number;
  };
  priority?: boolean;
  className?: string;
}

export function MediaCard({ media, priority = false, className }: MediaCardProps) {
  const [currentPoster, setCurrentPoster] = useState(media.posterUrl);
  const [currentTitle, setCurrentTitle] = useState(media.title);
  const [currentReleaseYear, setCurrentReleaseYear] = useState(media.releaseYear || "");
  const [currentVoteAverage, setCurrentVoteAverage] = useState(media.voteAverage || 0);
  const [currentRuntime, setCurrentRuntime] = useState<number>(
    "runtime" in media && media.runtime ? media.runtime : 0
  );
  const [currentSeasonsCount, setCurrentSeasonsCount] = useState<number | undefined>(
    "seasonsCount" in media ? media.seasonsCount : undefined
  );
  const [currentEpisodesCount, setCurrentEpisodesCount] = useState<number | undefined>(
    "episodesCount" in media ? media.episodesCount : undefined
  );
  const [currentIsAnime, setCurrentIsAnime] = useState<boolean | undefined>(
    "isAnime" in media ? (media as any).isAnime : undefined
  );
  const [imageError, setImageError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Sincroniza estado caso as props mudem dinamicamente
  useEffect(() => {
    setCurrentPoster(media.posterUrl);
    setCurrentTitle(media.title);
    if (media.releaseYear) setCurrentReleaseYear(media.releaseYear);
    if (media.voteAverage) setCurrentVoteAverage(media.voteAverage);
    if ("runtime" in media && media.runtime) setCurrentRuntime(media.runtime);
    if ("seasonsCount" in media) setCurrentSeasonsCount(media.seasonsCount);
    if ("episodesCount" in media) setCurrentEpisodesCount(media.episodesCount);
    if ("isAnime" in media && (media as any).isAnime !== undefined) {
      setCurrentIsAnime((media as any).isAnime);
    }
  }, [
    media.posterUrl,
    media.title,
    media.releaseYear,
    media.voteAverage,
    "runtime" in media ? media.runtime : null,
    "seasonsCount" in media ? media.seasonsCount : null,
    "episodesCount" in media ? media.episodesCount : null,
    (media as any).isAnime,
  ]);

  // Autocura de metadados: Se o pôster, ano ou tempo total estiverem ausentes, busca direto do TMDB
  useEffect(() => {
    const isInvalidPoster =
      !currentPoster ||
      currentPoster.trim() === "" ||
      currentPoster.includes("test.jpg") ||
      imageError;

    const isMissingYear =
      !currentReleaseYear ||
      currentReleaseYear.trim() === "" ||
      currentReleaseYear === "—";

    const isMissingRuntime = !currentRuntime || currentRuntime === 0;

    if (
      (isInvalidPoster || isMissingYear || isMissingRuntime) &&
      !isRecovering &&
      media.id &&
      media.mediaType
    ) {
      setIsRecovering(true);
      fetch(
        `/api/catalog/poster?tmdbId=${encodeURIComponent(media.id)}&mediaType=${encodeURIComponent(media.mediaType)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (data.posterUrl && data.posterUrl !== currentPoster) {
              setCurrentPoster(data.posterUrl);
              setImageError(false);
            }
            if (data.title && (!currentTitle || currentTitle.startsWith("Item #"))) {
              setCurrentTitle(data.title);
            }
            if (data.releaseYear && (!currentReleaseYear || currentReleaseYear === "—")) {
              setCurrentReleaseYear(data.releaseYear);
            }
            if (data.voteAverage && !currentVoteAverage) {
              setCurrentVoteAverage(data.voteAverage);
            }
            if (data.runtime && (!currentRuntime || currentRuntime === 0)) {
              setCurrentRuntime(data.runtime);
            }
            if (data.seasonsCount && !currentSeasonsCount) {
              setCurrentSeasonsCount(data.seasonsCount);
            }
            if (data.episodesCount && !currentEpisodesCount) {
              setCurrentEpisodesCount(data.episodesCount);
            }
            if (typeof data.isAnime === "boolean") {
              setCurrentIsAnime(data.isAnime);
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsRecovering(false));
    }
  }, [
    currentPoster,
    imageError,
    media.id,
    media.mediaType,
    isRecovering,
    currentTitle,
    currentReleaseYear,
    currentVoteAverage,
    currentRuntime,
    currentSeasonsCount,
    currentEpisodesCount,
  ]);

  const isAnimeType = media.mediaType === "ANIME";
  const isRealAnime = isAnimeType
    ? isJapaneseAnime({
        ...(media as any),
        isAnime: currentIsAnime,
        title: currentTitle,
      })
    : false;

  const displayType = isAnimeType
    ? (isRealAnime ? "ANIME" : "DESENHO")
    : media.mediaType;

  const typeLabels: Record<string, string> = {
    FILME: "Filme",
    SERIE: "Série",
    ANIME: "Anime",
    DESENHO: "Desenho",
    DORAMA: "Dorama",
  };

  const typeColors: Record<string, string> = {
    FILME: "bg-blue-500/25 text-blue-200 border-blue-400/30",
    SERIE: "bg-emerald-500/25 text-emerald-200 border-emerald-400/30",
    ANIME: "bg-purple-500/25 text-purple-200 border-purple-400/30",
    DESENHO: "bg-amber-500/25 text-amber-200 border-amber-400/30",
    DORAMA: "bg-rose-500/25 text-rose-200 border-rose-400/30",
  };

  const routeType = displayType === "DESENHO" ? "desenho" : media.mediaType.toLowerCase();
  const detailsHref = `/detalhes/${routeType}/${media.id}`;

  const sNum = "seasonNumber" in media ? media.seasonNumber : undefined;
  const eNum = "episodeNumber" in media ? media.episodeNumber : undefined;
  const isSeries = media.mediaType !== "FILME";
  const hasContinueWatchingProgress =
    "progressPercent" in media && typeof media.progressPercent === "number";

  // Se o item tem episódio registrado ou progresso, o clique principal inicia o player
  const primaryHref =
    isSeries && sNum && eNum
      ? `/assistir/${routeType}/${media.id}?s=${sNum}&e=${eNum}`
      : hasContinueWatchingProgress ||
        ("overview" in media && (media as any).overview === "Em andamento")
      ? `/assistir/${routeType}/${media.id}`
      : detailsHref;

  // Formata o tempo total padronizado para filme, série, anime, dorama ou episódio
  const durationText = formatMediaDuration({
    mediaType: displayType,
    runtime: currentRuntime,
    seasonsCount: currentSeasonsCount,
    episodesCount: currentEpisodesCount,
    seasonNumber: sNum,
    episodeNumber: eNum,
  });

  return (
    <div
      className={cn(
        "group relative rounded-2xl transition-all duration-300 block select-none",
        className ? className : "flex-shrink-0 w-[140px] sm:w-[170px] md:w-[195px] lg:w-[210px]",
        "hover:z-30 focus-within:z-30"
      )}
    >
      <Link
        href={primaryHref}
        tabIndex={0}
        className={cn(
          "relative rounded-2xl overflow-hidden bg-surface-card border border-white/[0.08] transition-all duration-300 block",
          "hover:scale-[1.04] hover:shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:border-white/30",
          "focus-visible:scale-[1.04] focus-visible:shadow-tv focus-visible:border-white outline-none"
        )}
      >
        {/* Container de imagem com proporção 2:3 */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-light">
          {currentPoster && !imageError ? (
            <Image
              src={currentPoster}
              alt={currentTitle || media.title}
              fill
              sizes="(max-width: 640px) 140px, (max-width: 768px) 170px, (max-width: 1024px) 195px, 210px"
              priority={priority}
              onError={() => setImageError(true)}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-surface to-background text-gray-500">
              {media.mediaType === "FILME" ? (
                <Film className="w-9 h-9 text-gray-500 mb-2" />
              ) : (
                <Tv className="w-9 h-9 text-gray-500 mb-2" />
              )}
              <span className="text-xs font-semibold text-gray-300 line-clamp-3">
                {currentTitle || media.title}
              </span>
            </div>
          )}

          {/* Gradiente escuro sobre a imagem */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl transform translate-y-1 group-hover:translate-y-0 transition-transform backdrop-blur-md">
              <Play className="w-5 h-5 fill-black ml-0.5" />
            </div>
          </div>

          {/* Badge de tipo de mídia (Apple Glass Pill) - Topo Esquerdo */}
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-xl border shadow-sm",
                typeColors[displayType] || "bg-black/60 text-white border-white/10"
              )}
            >
              {typeLabels[displayType] || displayType}
            </span>
          </div>

          {/* Badge de Nota TMDB (Apple Gold Chip) - Topo Direito */}
          {currentVoteAverage && currentVoteAverage > 0 ? (
            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xl border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-amber-300 shadow-sm pointer-events-none">
              <Star className="w-3 h-3 fill-amber-300" />
              <span>{currentVoteAverage}</span>
            </div>
          ) : null}

          {/* Indicador de Tempo Total do Título - Inferior Esquerdo */}
          {durationText ? (
            <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/15 text-[10px] font-medium text-white/90 shadow-sm pointer-events-none">
              <Clock className="w-3 h-3 text-white/70" />
              <span>{durationText}</span>
            </div>
          ) : null}

          {/* Barra de progresso para Continuar Assistindo */}
          {hasContinueWatchingProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div
                className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      15,
                      "progressPercent" in media && media.progressPercent ? media.progressPercent : 40
                    )
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Informações textuais */}
        <div className="p-2.5 sm:p-3 bg-surface-card">
          <h3 className="font-semibold text-xs sm:text-[13px] text-white/90 truncate tracking-tight group-hover:text-white group-focus-visible:text-white">
            {currentTitle || media.title}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-white/50 font-medium mt-1">
            {isSeries && sNum && eNum ? (
              <span className="text-white/80 font-medium">T{sNum} • E{eNum}</span>
            ) : (
              <span>{currentReleaseYear || "—"}</span>
            )}
            {durationText ? (
              <span className="flex items-center gap-1 text-white/70 font-medium">
                <Clock className="w-3 h-3 text-white/40" />
                <span>{durationText}</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Menu de Três Pontinhos (•••) Padronizado - Inferior Direito do Card */}
      <div className="absolute bottom-2.5 right-2.5 z-30">
        <MediaContextMenu
          media={{
            id: media.id,
            mediaType: media.mediaType,
            title: currentTitle || media.title,
            posterUrl: currentPoster,
            backdropUrl: "backdropUrl" in media ? media.backdropUrl : null,
            seasonNumber: sNum,
            episodeNumber: eNum,
            runtime: currentRuntime,
            isAnime: currentIsAnime,
          }}
          menuPosition="auto"
        />
      </div>
    </div>
  );
}
