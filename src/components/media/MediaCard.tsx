"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Film, Tv, Play } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: EnrichedMedia | {
    id: string;
    mediaType: "FILME" | "SERIE" | "ANIME" | "DORAMA";
    title: string;
    posterUrl: string | null;
    releaseYear?: string;
    voteAverage?: number;
  };
  priority?: boolean;
}

export function MediaCard({ media, priority = false }: MediaCardProps) {
  const [currentPoster, setCurrentPoster] = useState(media.posterUrl);
  const [currentTitle, setCurrentTitle] = useState(media.title);
  const [currentReleaseYear, setCurrentReleaseYear] = useState(media.releaseYear || "");
  const [currentVoteAverage, setCurrentVoteAverage] = useState(media.voteAverage || 0);
  const [imageError, setImageError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Sincroniza estado caso as props mudem dinamicamente
  React.useEffect(() => {
    setCurrentPoster(media.posterUrl);
    setCurrentTitle(media.title);
    if (media.releaseYear) setCurrentReleaseYear(media.releaseYear);
    if (media.voteAverage) setCurrentVoteAverage(media.voteAverage);
  }, [media.posterUrl, media.title, media.releaseYear, media.voteAverage]);

  // Autocura de metadados: Se o pôster ou o ano de lançamento estiverem ausentes, busca direto do TMDB
  React.useEffect(() => {
    const isInvalidPoster =
      !currentPoster ||
      currentPoster.trim() === "" ||
      currentPoster.includes("test.jpg") ||
      imageError;

    const isMissingYear =
      !currentReleaseYear ||
      currentReleaseYear.trim() === "" ||
      currentReleaseYear === "—";

    if ((isInvalidPoster || isMissingYear) && !isRecovering && media.id && media.mediaType) {
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
          }
        })
        .catch(() => {})
        .finally(() => setIsRecovering(false));
    }
  }, [currentPoster, imageError, media.id, media.mediaType, isRecovering, currentTitle, currentReleaseYear, currentVoteAverage]);

  const typeLabels: Record<string, string> = {
    FILME: "Filme",
    SERIE: "Série",
    ANIME: "Anime",
    DORAMA: "Dorama",
  };

  const typeColors: Record<string, string> = {
    FILME: "bg-blue-600/80 text-blue-100",
    SERIE: "bg-emerald-600/80 text-emerald-100",
    ANIME: "bg-purple-600/80 text-purple-100",
    DORAMA: "bg-rose-600/80 text-rose-100",
  };

  const routeType = media.mediaType.toLowerCase();
  const href = `/detalhes/${routeType}/${media.id}`;

  return (
    <Link
      href={href}
      tabIndex={0}
      className={cn(
        "group relative flex-shrink-0 w-[140px] sm:w-[170px] md:w-[195px] lg:w-[210px] rounded-xl overflow-hidden bg-surface-card border border-white/5 transition-all duration-200 block select-none",
        "hover:scale-105 hover:shadow-2xl hover:shadow-black/80 hover:border-white/20 hover:z-30",
        "focus-visible:scale-105 focus-visible:shadow-tv focus-visible:border-white focus-visible:z-40"
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
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-surface-light to-surface">
            {media.mediaType === "FILME" ? (
              <Film className="w-10 h-10 text-gray-500 mb-2" />
            ) : (
              <Tv className="w-10 h-10 text-gray-500 mb-2" />
            )}
            <span className="text-xs font-semibold text-gray-300 line-clamp-3">
              {currentTitle || media.title}
            </span>
          </div>
        )}

        {/* Gradiente escuro sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/40 transform translate-y-2 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Badge de tipo de mídia */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow",
              typeColors[media.mediaType] || "bg-black/60 text-white"
            )}
          >
            {typeLabels[media.mediaType] || media.mediaType}
          </span>
        </div>

        {/* Badge de Nota TMDB se disponível */}
        {currentVoteAverage && currentVoteAverage > 0 ? (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{currentVoteAverage}</span>
          </div>
        ) : null}
      </div>

      {/* Informações textuais */}
      <div className="p-2.5 sm:p-3">
        <h3 className="font-semibold text-xs sm:text-sm text-gray-100 truncate group-hover:text-white group-focus-visible:text-white">
          {currentTitle || media.title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
          <span>{currentReleaseYear || "—"}</span>
        </div>
      </div>
    </Link>
  );
}
