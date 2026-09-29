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

  // 1. Continuar Assistindo (do banco de dados - apenas o que cabe na tela)
  let continueWatching: EnrichedMedia[] = [];
  if (profile) {
    try {
      const history = await prisma.watchHistory.findMany({
        where: { profileId: profile.id, isCompleted: false },
        orderBy: { lastWatchedAt: "desc" },
        take: 8,
      });

      continueWatching = await Promise.all(
        history.map(async (h) => {
          let posterUrl = h.posterUrl;
          let backdropUrl: string | null = null;
          let title = h.title;
          let releaseYear = "";
          let voteAverage = 0;
          let runtime = 0;

          try {
            const details = await metadataProvider.getDetails(h.tmdbId, h.mediaType);
            if (details) {
              if (details.posterUrl) posterUrl = details.posterUrl;
              if (details.backdropUrl) backdropUrl = details.backdropUrl;
              if (!title || title.startsWith("Item #")) title = details.title;
              if (details.releaseYear) releaseYear = details.releaseYear;
              if (details.voteAverage) voteAverage = details.voteAverage;
              if (details.runtime) runtime = details.runtime;

              // Autocura no banco se o poster ou título estavam vazios
              if (!h.posterUrl || h.posterUrl !== posterUrl || !h.title) {
                prisma.watchHistory
                  .updateMany({
                    where: { profileId: profile.id, tmdbId: h.tmdbId, mediaType: h.mediaType },
                    data: { posterUrl, title },
                  })
                  .catch(() => {});
              }
            }
          } catch (err) {
            console.warn(`Erro ao auto-enriquecer item de histórico #${h.tmdbId}:`, err);
          }

          return {
            id: h.tmdbId,
            mediaType: h.mediaType,
            title: title || `Item #${h.tmdbId}`,
            originalTitle: "",
            overview: h.seasonNumber
              ? `Temporada ${h.seasonNumber}, Episódio ${h.episodeNumber}`
              : "Em andamento",
            posterUrl,
            backdropUrl,
            releaseDate: null,
            releaseYear,
            genres: [],
            runtime,
            voteAverage,
            voteCount: 0,
            cast: [],
            seasonNumber: h.seasonNumber > 0 ? h.seasonNumber : undefined,
            episodeNumber: h.episodeNumber > 0 ? h.episodeNumber : undefined,
            progressPercent: h.isCompleted ? 100 : 45,
          };
        })
      );
    } catch (e) {
      console.warn("Erro ao buscar histórico para home:", e);
    }
  }

  // 2. Minha Lista (do banco de dados - apenas o que cabe na tela)
  let watchlistItems: EnrichedMedia[] = [];
  if (profile) {
    try {
      const list = await prisma.watchlistItem.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      watchlistItems = await Promise.all(
        list.map(async (item) => {
          let posterUrl = item.posterUrl;
          let title = item.title;
          const isInvalid = !posterUrl || posterUrl.trim() === "" || posterUrl.includes("test.jpg");

          if (isInvalid) {
            try {
              const details = await metadataProvider.getDetails(item.tmdbId, item.mediaType);
              if (details.posterUrl) {
                posterUrl = details.posterUrl;
                if (!title || title.startsWith("Item #")) title = details.title;
                // Autocura no banco
                prisma.watchlistItem
                  .update({
                    where: { id: item.id },
                    data: { posterUrl: details.posterUrl, title: details.title },
                  })
                  .catch(() => {});
              }
            } catch (err) {
              console.warn(`Erro ao auto-enriquecer poster de watchlist #${item.tmdbId}:`, err);
            }
          }

          return {
            id: item.tmdbId,
            mediaType: item.mediaType,
            title: title || `Item #${item.tmdbId}`,
            originalTitle: "",
            overview: "",
            posterUrl,
            backdropUrl: null,
            releaseDate: null,
            releaseYear: "",
            genres: [],
            runtime: 0,
            voteAverage: 0,
            voteCount: 0,
            cast: [],
          };
        })
      );
    } catch (e) {
      console.warn("Erro ao carregar Minha Lista para home:", e);
    }
  }

  // 3. Catálogo por categorias (carrega somente o necessário para a tela inicial: 10 por fileira)
  let movieItems: EnrichedMedia[] = [];
  let seriesItems: EnrichedMedia[] = [];
  let animeItems: EnrichedMedia[] = [];
  let cartoonItems: EnrichedMedia[] = [];
  let doramaItems: EnrichedMedia[] = [];
  let actionItems: EnrichedMedia[] = [];

  try {
    const [movieIds, seriesIds, animeIds, cartoonIds, doramaIds, actionIds] = await Promise.all([
      catalogProvider.getCategoryItemIds("filme"),
      catalogProvider.getCategoryItemIds("serie"),
      catalogProvider.getCategoryItemIds("anime"),
      catalogProvider.getCategoryItemIds("desenho"),
      catalogProvider.getCategoryItemIds("dorama"),
      catalogProvider.getItemIdsByGenre("filme", "acao"),
    ]);

    // Separa animes puros e desenhos ocidentais
    const cartoonSet = new Set(cartoonIds);
    const pureAnimeIds = animeIds.filter((id) => !cartoonSet.has(id));

    const [movies, series, animes, cartoons, doramas, action] = await Promise.all([
      metadataProvider.getBatchDetails(movieIds.slice(0, 10), "FILME"),
      metadataProvider.getBatchDetails(seriesIds.slice(0, 10), "SERIE"),
      metadataProvider.getBatchDetails(pureAnimeIds.slice(0, 10), "ANIME"),
      metadataProvider.getBatchDetails(cartoonIds.slice(0, 10), "ANIME"),
      metadataProvider.getBatchDetails(doramaIds.slice(0, 10), "DORAMA"),
      metadataProvider.getBatchDetails(actionIds.slice(0, 10), "FILME"),
    ]);

    movieItems = movies;
    seriesItems = series;
    animeItems = animes;
    cartoonItems = cartoons;
    doramaItems = doramas;
    actionItems = action;
  } catch (error) {
    console.error("Erro ao carregar itens do catálogo para a Home:", error);
  }

  // Define candidatos para o carrossel Apple TV (Featured Shelf)
  const heroCandidates = [
    ...movieItems.filter((m) => m.backdropUrl),
    ...seriesItems.filter((s) => s.backdropUrl),
    ...animeItems.filter((a) => a.backdropUrl),
  ].slice(0, 6);

  const defaultHero = heroCandidates[0] || movieItems[0] || seriesItems[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner estilo Apple TV+ */}
      {defaultHero ? (
        <HeroBanner items={heroCandidates} media={defaultHero} />
      ) : (
        <div className="pt-24 px-4 sm:px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Plix Streaming</h1>
          <p className="text-gray-400">Carregando catálogo...</p>
        </div>
      )}

      {/* Fileiras de Mídia com espaçamento limpo Apple TV (sem colisão com o carrossel) */}
      <div className="relative z-20 space-y-4 sm:space-y-6 pb-16 pt-2 sm:pt-4">
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

        {animeItems.length > 0 && (
          <MediaRow
            title="Animes em Destaque"
            items={animeItems}
            viewAllHref="/animes"
          />
        )}

        {cartoonItems.length > 0 && (
          <MediaRow
            title="Desenhos Animados"
            items={cartoonItems}
            viewAllHref="/desenhos"
          />
        )}

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
