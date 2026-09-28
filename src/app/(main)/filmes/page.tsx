export const dynamic = "force-dynamic";

import React from "react";
import { catalogProvider } from "@/providers/catalog/warezcdn-catalog.provider";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { CategoryExplorer } from "@/components/media/CategoryExplorer";

interface PageProps {
  searchParams: Promise<{ genero?: string; page?: string }>;
}

export default async function FilmesPage({ searchParams }: PageProps) {
  const { genero, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 24;

  const genres = await catalogProvider.getGenres("filme");

  let ids: string[] = [];
  if (genero) {
    ids = await catalogProvider.getItemIdsByGenre("filme", genero);
  } else {
    ids = await catalogProvider.getCategoryItemIds("filme");
  }

  const offset = (currentPage - 1) * pageSize;
  const pageIds = ids.slice(offset, offset + pageSize);
  const items = await metadataProvider.getBatchDetails(pageIds, "FILME");

  return (
    <CategoryExplorer
      title="Filmes"
      category="filme"
      genres={genres}
      items={items}
      activeGenre={genero}
      page={currentPage}
      hasMore={offset + pageSize < ids.length}
    />
  );
}
