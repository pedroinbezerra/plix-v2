"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Film, Tv, Clock } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { cn, formatMediaDuration, formatMinutes } from "@/lib/utils";
import { isJapaneseAnime } from "@/lib/media-classifier";
import { MediaContextMenu } from "./MediaContextMenu";

interface LandscapeMediaCardProps {
  media: EnrichedMedia | {
    id: string;
    mediaType: "FILME" | "SERIE" | "ANIME" | "DORAMA";
    title: string;
    posterUrl: string | null;
    backdropUrl?: string | null;
    overview?: string;
    releaseYear?: string;
    voteAverage?: number;
    seasonNumber?: number;
    episodeNumber?: number;
    progressPercent?: number; // 0 a 100
    runtime?: number;
    seasonsCount?: number;
    episodesCount?: number;
  };
  priority?: boolean;
  className?: string;
}

export function LandscapeMediaCard({
  media,
  priority = false,
  className,
}: LandscapeMediaCardProps) {
  const [currentBackdrop, setCurrentBackdrop] = useState(
    media.backdropUrl || media.posterUrl
  );
  const [currentTitle, setCurrentTitle] = useState(media.title);
  const [currentReleaseYear, setCurrentReleaseYear] = useState(media.releaseYear || "");
  const [currentRuntime, setCurrentRuntime] = useState<number>(
    "runtime" in media && media.runtime ? media.runtime : 0
  );
  const [currentSeasonsCount, setCurrentSeasonsCount] = useState<number | undefined>(
    "seasonsCount" in media ? media.seasonsCount : undefined
  );
  const [currentEpisodesCount, setCurrentEpisodesCount] = useState<number | undefined>(
    "episodesCount" in media ? media.episodesCount : undefined
  );
  const [imageError, setImageError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    setCurrentBackdrop(media.backdropUrl || media.posterUrl);
    setCurrentTitle(media.title);
    if (media.releaseYear) setCurrentReleaseYear(media.releaseYear);
    if ("runtime" in media && media.runtime) setCurrentRuntime(media.runtime);
    if ("seasonsCount" in media) setCurrentSeasonsCount(media.seasonsCount);
    if ("episodesCount" in media) setCurrentEpisodesCount(media.episodesCount);
  }, [
    media.backdropUrl,
    media.posterUrl,
    media.title,
    media.releaseYear,
    "runtime" in media ? media.runtime : null,
    "seasonsCount" in media ? media.seasonsCount : null,
    "episodesCount" in media ? media.episodesCount : null,
  ]);

  // Autocura de metadados: Se o backdrop ou duração estiverem ausentes, busca do TMDB
  useEffect(() => {
    const isInvalid = !currentBackdrop || currentBackdrop.includes("test.jpg") || imageError;
    const isMissingRuntime = !currentRuntime || currentRuntime === 0;

    if ((isInvalid || isMissingRuntime) && !isRecovering && media.id && media.mediaType) {
      setIsRecovering(true);
      fetch(
        `/api/catalog/poster?tmdbId=${encodeURIComponent(media.id)}&mediaType=${encodeURIComponent(media.mediaType)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const nextImg = data.backdropUrl || data.posterUrl;
            if (nextImg && nextImg !== currentBackdrop) {
              setCurrentBackdrop(nextImg);
              setImageError(false);
            }
            if (data.title && (!currentTitle || currentTitle.startsWith("Item #"))) {
              setCurrentTitle(data.title);
            }
            if (data.releaseYear && !currentReleaseYear) {
              setCurrentReleaseYear(data.releaseYear);
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
          }
        })
        .catch(() => {})
        .finally(() => setIsRecovering(false));
    }
  }, [
    currentBackdrop,
    imageError,
    media.id,
    media.mediaType,
    isRecovering,
    currentTitle,
    currentReleaseYear,
    currentRuntime,
    currentSeasonsCount,
    currentEpisodesCount,
  ]);

  const isAnimeType = media.mediaType === "ANIME";
  const isRealAnime = isAnimeType ? isJapaneseAnime(media as any) : false;
  const displayType = isAnimeType ? (isRealAnime ? "ANIME" : "DESENHO") : media.mediaType;

  const routeType = displayType === "DESENHO" ? "desenho" : media.mediaType.toLowerCase();
  const sNum = "seasonNumber" in media ? media.seasonNumber : undefined;
  const eNum = "episodeNumber" in media ? media.episodeNumber : undefined;
  const isSeries = media.mediaType !== "FILME";

  const playHref =
    isSeries && sNum && eNum
      ? `/assistir/${routeType}/${media.id}?s=${sNum}&e=${eNum}`
      : `/assistir/${routeType}/${media.id}`;

  const durationText = formatMediaDuration({
    mediaType: displayType,
    runtime: currentRuntime,
    seasonsCount: currentSeasonsCount,
    episodesCount: currentEpisodesCount,
    seasonNumber: sNum,
    episodeNumber: eNum,
  });

  // Formatação do status inferior esquerdo estilo Apple TV
  const renderStatus = () => {
    if (isSeries && sNum && eNum) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-white/95 font-medium">
          <Play className="w-3 h-3 fill-white text-white" />
          <span>
            T{sNum}, E{eNum}
            {currentRuntime > 0 ? ` • ${formatMinutes(currentRuntime)}` : ""}
          </span>
        </span>
      );
    }

    if (durationText) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-white/95 font-medium">
          <Clock className="w-3 h-3 text-white/70" />
          <span>{durationText}</span>
        </span>
      );
    }

    return (
      <span className="text-xs text-white/80 font-medium">
        Em Quero Assistir
      </span>
    );
  };

  return (
    <div
      data-card-wrapper="true"
      className={cn(
        "group relative rounded-2xl transition-all duration-300 block select-none",
        className ? className : "flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] lg:w-[350px]",
        "hover:z-30 focus-within:z-30"
      )}
    >
      <Link
        href={playHref}
        tabIndex={0}
        data-card-link="true"
        data-media-id={String(media.id)}
        className={cn(
          "relative aspect-video w-full rounded-2xl overflow-hidden bg-[#14151e] border border-white/[0.08] block",
          "hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:border-white/30 hover:z-20 transition-all duration-300",
          "focus-visible:scale-[1.04] focus-visible:shadow-tv focus-visible:border-white focus-visible:z-20 outline-none"
        )}
      >
        {/* Imagem de Backdrop */}
        {currentBackdrop && !imageError ? (
          <Image
            src={currentBackdrop}
            alt={currentTitle || media.title}
            fill
            sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, (max-width: 1024px) 320px, 350px"
            priority={priority}
            onError={() => setImageError(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#121319] to-background text-gray-500">
            {media.mediaType === "FILME" ? (
              <Film className="w-8 h-8 mb-1.5 text-gray-500" />
            ) : (
              <Tv className="w-8 h-8 mb-1.5 text-gray-500" />
            )}
            <span className="text-xs font-semibold text-gray-300 line-clamp-2">
              {currentTitle || media.title}
            </span>
          </div>
        )}

        {/* Gradiente sutil inferior no cartão */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Frosted Play button central estilo Apple TV ao passar o mouse */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl transform translate-y-1 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Barra de Status Inferior Estilo Apple TV (Duração à esquerda) */}
        <div className="absolute bottom-2.5 left-3.5 z-20 pointer-events-none drop-shadow">
          {renderStatus()}
        </div>

        {/* Barra de progresso Apple TV (Up Next Progress) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
          <div
            className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  15,
                  "progressPercent" in media && media.progressPercent
                    ? media.progressPercent
                    : 45
                )
              )}%`,
            }}
          />
        </div>
      </Link>

      {/* Menu Contextual Estilo Apple TV (•••) Padronizado - Inferior Direito */}
      <div className="absolute bottom-2 right-2.5 z-30">
        <MediaContextMenu
          media={{
            id: media.id,
            mediaType: media.mediaType,
            title: currentTitle || media.title,
            posterUrl: currentBackdrop,
            backdropUrl: currentBackdrop,
            seasonNumber: sNum,
            episodeNumber: eNum,
            runtime: currentRuntime,
          }}
          menuPosition="auto"
        />
      </div>
    </div>
  );
}
