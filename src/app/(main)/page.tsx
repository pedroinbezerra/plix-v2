export const dynamic = "force-dynamic";

import React from "react";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { catalogProvider } from "@/providers/catalog/warezcdn-catalog.provider";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { EnrichedMedia } from "@/providers/metadata/types";
import { HeroBanner } from "@/components/media/HeroBanner";
import { MediaRow } from "@/components/media/MediaRow";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  // 1. Continuar Assistindo (do banco de dados)
  let continueWatching: EnrichedMedia[] = [];
  if (profile) {
    try {
      const history = await prisma.watchHistory.findMany({
        where: { profileId: profile.id, isCompleted: false },
        orderBy: { lastWatchedAt: "desc" },
        take: 12,
      });

      continueWatching = history.map((h) => ({
        id: h.tmdbId,
        mediaType: h.mediaType,
        title: h.title || `Item #${h.tmdbId}`,
        originalTitle: "",
        overview: h.seasonNumber
          ? `Temporada ${h.seasonNumber}, Episódio ${h.episodeNumber}`
          : "Em andamento",
        posterUrl: h.posterUrl,
        backdropUrl: null,
        releaseDate: null,
        releaseYear: "",
        genres: [],
        runtime: 0,
        voteAverage: 0,
        voteCount: 0,
        cast: [],
      }));
    } catch (e) {
      console.warn("Erro ao buscar histórico para home:", e);
    }
  }

  // 2. Minha Lista (do banco de dados)
  let watchlistItems: EnrichedMedia[] = [];
  if (profile) {
    try {
      const list = await prisma.watchlistItem.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 16,
      });

      watchlistItems = list.map((item) => ({
        id: item.tmdbId,
        mediaType: item.mediaType,
        title: item.title || `Item #${item.tmdbId}`,
        originalTitle: "",
        overview: "",
        posterUrl: item.posterUrl,
        backdropUrl: null,
        releaseDate: null,
        releaseYear: "",
        genres: [],
        runtime: 0,
        voteAverage: 0,
        voteCount: 0,
        cast: [],
      }));
    } catch (e) {
      console.warn("Erro ao carregar Minha Lista para home:", e);
    }
  }

  // 3. Catálogo por categorias
  let movieItems: EnrichedMedia[] = [];
  let seriesItems: EnrichedMedia[] = [];
  let animeItems: EnrichedMedia[] = [];
  let doramaItems: EnrichedMedia[] = [];
  let actionItems: EnrichedMedia[] = [];

  try {
    const [movieIds, seriesIds, animeIds, doramaIds, actionIds] = await Promise.all([
      catalogProvider.getCategoryItemIds("filme"),
      catalogProvider.getCategoryItemIds("serie"),
      catalogProvider.getCategoryItemIds("anime"),
      catalogProvider.getCategoryItemIds("dorama"),
      catalogProvider.getItemIdsByGenre("filme", "acao"),
    ]);

    const [movies, series, animes, doramas, action] = await Promise.all([
      metadataProvider.getBatchDetails(movieIds.slice(0, 16), "FILME"),
      metadataProvider.getBatchDetails(seriesIds.slice(0, 16), "SERIE"),
      metadataProvider.getBatchDetails(animeIds.slice(0, 16), "ANIME"),
      metadataProvider.getBatchDetails(doramaIds.slice(0, 16), "DORAMA"),
      metadataProvider.getBatchDetails(actionIds.slice(0, 16), "FILME"),
    ]);

    movieItems = movies;
    seriesItems = series;
    animeItems = animes;
    doramaItems = doramas;
    actionItems = action;
  } catch (error) {
    console.error("Erro ao carregar itens do catálogo para a Home:", error);
  }

  // Define o item de destaque (Hero Banner)
  const heroCandidate =
    movieItems.find((m) => m.backdropUrl) ||
    seriesItems.find((s) => s.backdropUrl) ||
    movieItems[0] ||
    seriesItems[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      {heroCandidate ? (
        <HeroBanner media={heroCandidate} />
      ) : (
        <div className="pt-24 px-4 sm:px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Plix Streaming</h1>
          <p className="text-gray-400">Carregando catálogo...</p>
        </div>
      )}

      {/* Fileiras de Mídia */}
      <div className="-mt-12 sm:-mt-24 relative z-30 space-y-2">
        {continueWatching.length > 0 && (
          <MediaRow
            title="Continuar Assistindo"
            items={continueWatching}
            viewAllHref="/historico"
            priority
          />
        )}

        {watchlistItems.length > 0 && (
          <MediaRow
            title="Minha Lista"
            items={watchlistItems}
            viewAllHref="/minha-lista"
          />
        )}

        <MediaRow
          title="Filmes em Destaque"
          items={movieItems}
          viewAllHref="/filmes"
          priority
        />

        <MediaRow
          title="Séries Populares"
          items={seriesItems}
          viewAllHref="/series"
        />

        <MediaRow
          title="Animes"
          items={animeItems}
          viewAllHref="/animes"
        />

        <MediaRow
          title="Doramas"
          items={doramaItems}
          viewAllHref="/doramas"
        />

        {actionItems.length > 0 && (
          <MediaRow
            title="Ação & Aventura"
            items={actionItems}
            viewAllHref="/filmes?genero=acao"
          />
        )}
      </div>
    </div>
  );
}
