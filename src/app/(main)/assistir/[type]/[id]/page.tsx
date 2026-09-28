export const dynamic = "force-dynamic";

import React from "react";
import { notFound } from "next/navigation";
import { MediaType } from "@prisma/client";
import { playbackProvider } from "@/providers/playback/warezcdn-playback.provider";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { StreamingPlayer } from "@/components/player/StreamingPlayer";

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
  searchParams: Promise<{
    s?: string;
    e?: string;
  }>;
}

export default async function AssistirPage({ params, searchParams }: PageProps) {
  const { type, id } = await params;
  const { s, e } = await searchParams;

  const normalizedType = type.toUpperCase();
  const validTypes: Record<string, MediaType> = {
    FILME: "FILME",
    SERIE: "SERIE",
    ANIME: "ANIME",
    DORAMA: "DORAMA",
    DESENHO: "ANIME",
    DESENHOS: "ANIME",
  };

  const mediaType = validTypes[normalizedType];
  if (!mediaType) {
    notFound();
  }

  const isMovie = mediaType === "FILME";
  const seasonNumber = !isMovie ? Math.max(1, parseInt(s || "1", 10)) : undefined;
  const episodeNumber = !isMovie ? Math.max(1, parseInt(e || "1", 10)) : undefined;

  // Constrói a configuração segura do player (com noLink e noEpList para suprimir anúncios e links externos)
  const playerConfig = isMovie
    ? playbackProvider.getMoviePlayerConfig(id, { noLink: true })
    : playbackProvider.getSeriesPlayerConfig(id, seasonNumber!, episodeNumber!, { noLink: true });

  // Enriquecimento de metadados para título e navegação
  const media = await metadataProvider.getDetails(id, mediaType);

  let episodeName = "";
  let nextEpisodeUrl: string | null = null;

  if (!isMovie && seasonNumber && episodeNumber) {
    try {
      const seasonDetails = await metadataProvider.getSeasonDetails(id, seasonNumber);
      const currentEp = seasonDetails.episodes.find(
        (ep) => ep.episodeNumber === episodeNumber
      );
      if (currentEp) {
        episodeName = currentEp.name;
      }

      // Verifica se existe próximo episódio na mesma temporada
      const hasNextInSeason = seasonDetails.episodes.some(
        (ep) => ep.episodeNumber === episodeNumber + 1
      );

      if (hasNextInSeason) {
        nextEpisodeUrl = `/assistir/${type}/${id}?s=${seasonNumber}&e=${episodeNumber + 1}`;
      } else if (media.seasonsCount && seasonNumber < media.seasonsCount) {
        // Próxima temporada, episódio 1
        nextEpisodeUrl = `/assistir/${type}/${id}?s=${seasonNumber + 1}&e=1`;
      }
    } catch (err) {
      console.warn("Erro ao calcular próximo episódio:", err);
    }
  }

  const backUrl = `/detalhes/${type}/${id}`;

  return (
    <StreamingPlayer
      streamUrl={playerConfig.streamUrl}
      allowDirectives={playerConfig.allowDirectives}
      title={media.title}
      mediaType={mediaType}
      tmdbId={id}
      seasonNumber={seasonNumber}
      episodeNumber={episodeNumber}
      episodeName={episodeName}
      nextEpisodeUrl={nextEpisodeUrl}
      backUrl={backUrl}
      posterUrl={media.posterUrl}
    />
  );
}
