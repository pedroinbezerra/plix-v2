export const dynamic = "force-dynamic";

import React from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MediaType } from "@prisma/client";
import {
  warezCdnPlaybackProvider,
  pomfyPlaybackProvider,
  streambetterPlaybackProvider,
} from "@/providers/playback";
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
    player?: string;
  }>;
}

export default async function AssistirPage({ params, searchParams }: PageProps) {
  const { type, id } = await params;
  const { s, e, player } = await searchParams;

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

  // Constrói configurações dos provedores (WarezCDN, Pomfy e StreamBetter)
  const warezConfig = isMovie
    ? warezCdnPlaybackProvider.getMoviePlayerConfig(id, { noLink: true })
    : warezCdnPlaybackProvider.getSeriesPlayerConfig(id, seasonNumber!, episodeNumber!, { noLink: true });

  const pomfyConfig = isMovie
    ? pomfyPlaybackProvider.getMoviePlayerConfig(id, { noLink: true })
    : pomfyPlaybackProvider.getSeriesPlayerConfig(id, seasonNumber!, episodeNumber!, { noLink: true });

  const streambetterConfig = isMovie
    ? streambetterPlaybackProvider.getMoviePlayerConfig(id)
    : streambetterPlaybackProvider.getSeriesPlayerConfig(id, seasonNumber!, episodeNumber!);

  const cookieStore = await cookies();
  const savedPlayer = cookieStore.get("plix_player_provider")?.value;
  const requestedPlayer = (player || savedPlayer || "warez").toLowerCase();

  const activeProviderId =
    requestedPlayer === "pomfy"
      ? "pomfy"
      : requestedPlayer === "streambetter"
      ? "streambetter"
      : "warez";

  const activeConfig =
    activeProviderId === "pomfy"
      ? pomfyConfig
      : activeProviderId === "streambetter"
      ? streambetterConfig
      : warezConfig;

  const availableProviders = [
    {
      id: "warez",
      name: "WarezCDN",
      streamUrl: warezConfig.streamUrl,
      allowDirectives: warezConfig.allowDirectives,
      useSandbox: true,
    },
    {
      id: "pomfy",
      name: "Pomfy",
      streamUrl: pomfyConfig.streamUrl,
      allowDirectives: pomfyConfig.allowDirectives,
      useSandbox: false,
    },
    {
      id: "streambetter",
      name: "StreamBetter",
      streamUrl: streambetterConfig.streamUrl,
      allowDirectives: streambetterConfig.allowDirectives,
      useSandbox: false, // StreamBetter proíbe explicitamente o atributo sandbox
    },
  ];

  // Enriquecimento de metadados para título e navegação
  const media = await metadataProvider.getDetails(id, mediaType);

  let episodeName = "";
  let nextEpisodeUrl: string | null = null;
  let episodeRuntime: number | undefined = undefined;

  if (!isMovie && seasonNumber && episodeNumber) {
    try {
      const seasonDetails = await metadataProvider.getSeasonDetails(id, seasonNumber);
      const currentEp = seasonDetails.episodes.find(
        (ep) => ep.episodeNumber === episodeNumber
      );
      if (currentEp) {
        episodeName = currentEp.name;
        episodeRuntime = currentEp.runtime;
      }

      // Verifica se existe próximo episódio na mesma temporada
      const hasNextInSeason = seasonDetails.episodes.some(
        (ep) => ep.episodeNumber === episodeNumber + 1
      );

      const playerParam = activeProviderId !== "warez" ? `&player=${activeProviderId}` : "";

      if (hasNextInSeason) {
        nextEpisodeUrl = `/assistir/${type}/${id}?s=${seasonNumber}&e=${episodeNumber + 1}${playerParam}`;
      } else if (media.seasonsCount && seasonNumber < media.seasonsCount) {
        // Próxima temporada, episódio 1
        nextEpisodeUrl = `/assistir/${type}/${id}?s=${seasonNumber + 1}&e=1${playerParam}`;
      }
    } catch (err) {
      console.warn("Erro ao calcular próximo episódio:", err);
    }
  }

  const backUrl = `/detalhes/${type}/${id}`;
  const effectiveRuntime = episodeRuntime || media.runtime || 0;

  return (
    <StreamingPlayer
      streamUrl={activeConfig.streamUrl}
      allowDirectives={activeConfig.allowDirectives}
      providers={availableProviders}
      initialProvider={activeProviderId}
      title={media.title}
      mediaType={mediaType}
      tmdbId={id}
      seasonNumber={seasonNumber}
      episodeNumber={episodeNumber}
      episodeName={episodeName}
      nextEpisodeUrl={nextEpisodeUrl}
      backUrl={backUrl}
      posterUrl={media.posterUrl}
      runtime={effectiveRuntime}
    />
  );
}
