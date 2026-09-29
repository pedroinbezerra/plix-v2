export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { Bookmark, Film } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { MediaCard } from "@/components/media/MediaCard";

export default async function MinhaListaPage() {
  const profile = await getCurrentProfile();

  const items = profile
    ? await prisma.watchlistItem.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const mediaList = await Promise.all(
    items.map(async (item) => {
      let posterUrl = item.posterUrl;
      let title = item.title;
      let releaseYear = "";
      let voteAverage = 0;

      let runtime = 0;
      let seasonsCount: number | undefined;
      let episodesCount: number | undefined;
      let backdropUrl: string | null = null;
      let isAnime: boolean | undefined;

      try {
        const details = await metadataProvider.getDetails(item.tmdbId, item.mediaType);
        if (details) {
          if (details.posterUrl) posterUrl = details.posterUrl;
          if (details.backdropUrl) backdropUrl = details.backdropUrl;
          if (!title || title.startsWith("Item #")) title = details.title;
          if (details.releaseYear) releaseYear = details.releaseYear;
          if (details.voteAverage) voteAverage = details.voteAverage;
          if (details.runtime) runtime = details.runtime;
          if (details.seasonsCount) seasonsCount = details.seasonsCount;
          if (details.episodesCount) episodesCount = details.episodesCount;
          if (typeof details.isAnime === "boolean") isAnime = details.isAnime;

          // Autocura no banco se o poster ou título estavam ausentes
          if (!item.posterUrl || item.posterUrl !== posterUrl || !item.title) {
            prisma.watchlistItem
              .update({
                where: { id: item.id },
                data: { posterUrl, title },
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.warn(`Erro ao auto-enriquecer item em Minha Lista #${item.tmdbId}:`, err);
      }

      return {
        id: item.tmdbId,
        mediaType: item.mediaType,
        title: title || `Item #${item.tmdbId}`,
        posterUrl,
        backdropUrl,
        releaseYear,
        voteAverage,
        runtime,
        seasonsCount,
        episodesCount,
        isAnime,
      };
    })
  );

  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen pb-16">
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-lg">
          <Bookmark className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Minha Lista
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            {mediaList.length} {mediaList.length === 1 ? "título salvo" : "títulos salvos"}
          </p>
        </div>
      </div>

      {mediaList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {mediaList.map((media) => (
            <MediaCard
              key={`${media.mediaType}-${media.id}`}
              media={media}
              className="w-full"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center apple-glass-card rounded-3xl p-10 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-white/50" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sua lista está vazia
          </h2>
          <p className="text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
            Navegue pelo catálogo de filmes, séries, animes e doramas e adicione seus títulos favoritos para assistir mais tarde.
          </p>
          <Link
            href="/"
            className="px-7 py-3 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-sm font-bold transition-all shadow-xl cursor-pointer"
          >
            Explorar Catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
