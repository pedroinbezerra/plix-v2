"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Film, Tv } from "lucide-react";
import { MediaType } from "@prisma/client";

interface HistoryThumbnailProps {
  tmdbId: string;
  mediaType: MediaType;
  initialPosterUrl?: string | null;
  title?: string | null;
}

export function HistoryThumbnail({
  tmdbId,
  mediaType,
  initialPosterUrl,
  title,
}: HistoryThumbnailProps) {
  const [currentPoster, setCurrentPoster] = useState(initialPosterUrl);
  const [imageError, setImageError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    setCurrentPoster(initialPosterUrl);
    setImageError(false);
  }, [initialPosterUrl]);

  // Autocura de imagem no histórico de reprodução:
  // Se a imagem for nula, vazia, de teste ou se quebrar ao carregar (404/erro),
  // busca diretamente do TMDB e atualiza a interface e o banco em tempo real.
  useEffect(() => {
    const isInvalid =
      !currentPoster ||
      currentPoster.trim() === "" ||
      currentPoster.includes("test.jpg") ||
      imageError;

    if (isInvalid && !isRecovering && tmdbId && mediaType) {
      setIsRecovering(true);
      fetch(
        `/api/catalog/poster?tmdbId=${encodeURIComponent(tmdbId)}&mediaType=${encodeURIComponent(mediaType)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.posterUrl) {
            setCurrentPoster(data.posterUrl);
            setImageError(false);
          }
        })
        .catch(() => {})
        .finally(() => setIsRecovering(false));
    }
  }, [currentPoster, imageError, tmdbId, mediaType, isRecovering]);

  const isMovie = mediaType === "FILME";

  if (currentPoster && !imageError) {
    return (
      <Image
        src={currentPoster}
        alt={title || "Poster"}
        fill
        sizes="80px"
        onError={() => setImageError(true)}
        className="object-cover"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-surface-light">
      {isMovie ? <Film className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
    </div>
  );
}
