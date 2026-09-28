"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Film, Tv } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { cn } from "@/lib/utils";
import { isJapaneseAnime } from "@/lib/media-classifier";

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
  const [imageError, setImageError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  React.useEffect(() => {
    setCurrentBackdrop(media.backdropUrl || media.posterUrl);
    setCurrentTitle(media.title);
    if (media.releaseYear) setCurrentReleaseYear(media.releaseYear);
  }, [media.backdropUrl, media.posterUrl, media.title, media.releaseYear]);

  // Autocura de metadados: Se o backdrop estiver ausente, busca do TMDB
  React.useEffect(() => {
    const isInvalid = !currentBackdrop || currentBackdrop.includes("test.jpg") || imageError;

    if (isInvalid && !isRecovering && media.id && media.mediaType) {
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
          }
        })
        .catch(() => {})
        .finally(() => setIsRecovering(false));
    }
  }, [currentBackdrop, imageError, media.id, media.mediaType, isRecovering, currentTitle, currentReleaseYear]);

  const isAnimeType = media.mediaType === "ANIME";
  const isRealAnime = isAnimeType ? isJapaneseAnime(media as any) : false;
  const displayType = isAnimeType ? (isRealAnime ? "ANIME" : "DESENHO") : media.mediaType;

  const typeLabels: Record<string, string> = {
    FILME: "Filme",
    SERIE: "Série",
    ANIME: "Anime",
    DESENHO: "Desenho",
    DORAMA: "Dorama",
  };

  const routeType = displayType === "DESENHO" ? "desenho" : media.mediaType.toLowerCase();

  // Se tiver episódio no histórico, linka para continuar assistindo de onde parou
  const sNum = "seasonNumber" in media ? media.seasonNumber : undefined;
  const eNum = "episodeNumber" in media ? media.episodeNumber : undefined;
  const isSeries = media.mediaType !== "FILME";

  const href = isSeries && sNum && eNum
    ? `/assistir/${routeType}/${media.id}?s=${sNum}&e=${eNum}`
    : `/detalhes/${routeType}/${media.id}`;

  const subtitle = isSeries && sNum && eNum
    ? `T${sNum}:E${eNum}`
    : currentReleaseYear || typeLabels[displayType];

  return (
    <Link
      href={href}
      tabIndex={0}
      className={cn(
        "group relative rounded-2xl overflow-hidden bg-surface-card border border-white/[0.08] transition-all duration-300 block select-none",
        className ? className : "flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] lg:w-[350px]",
        "hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:border-white/30 hover:z-30",
        "focus-visible:scale-[1.04] focus-visible:shadow-tv focus-visible:border-white focus-visible:z-40"
      )}
    >
      {/* Container de imagem widescreen 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-light">
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
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-surface to-background text-gray-500">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Frosted Play button central estilo Apple TV */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl transform translate-y-1 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform backdrop-blur-md">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Badge superior Apple Glass */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-black/60 text-white/90 backdrop-blur-xl border border-white/10 shadow">
            {typeLabels[displayType] || displayType}
          </span>
        </div>

        {/* Informações sobrepostas na base da imagem */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="font-bold text-xs sm:text-sm text-white drop-shadow truncate">
            {currentTitle || media.title}
          </h3>
          <p className="text-[11px] text-white/70 font-medium truncate mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Barra de progresso Apple TV (Up Next Progress) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
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
      </div>
    </Link>
  );
}
