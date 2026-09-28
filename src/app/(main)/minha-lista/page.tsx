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
          console.warn(`Erro ao auto-enriquecer poster em Minha Lista #${item.tmdbId}:`, err);
        }
      }

      return {
        id: item.tmdbId,
        mediaType: item.mediaType,
        title: title || `Item #${item.tmdbId}`,
        posterUrl,
        releaseYear: "",
        voteAverage: 0,
      };
    })
  );

  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen pb-16">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-primary" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {mediaList.map((media) => (
            <div key={`${media.mediaType}-${media.id}`} className="flex justify-center">
              <MediaCard media={media} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface/30 rounded-2xl border border-white/5 p-8">
          <Film className="w-16 h-16 text-gray-600 mb-4" />
          <h2 className="text-lg font-bold text-gray-200 mb-1">
            Sua lista está vazia
          </h2>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            Navegue pelo catálogo de filmes, séries, animes e doramas e adicione seus títulos favoritos para assistir mais tarde.
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-lg shadow-primary/25"
          >
            Explorar Catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
