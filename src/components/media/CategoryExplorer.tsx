"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GenreItem } from "@/providers/catalog/types";
import { EnrichedMedia } from "@/providers/metadata/types";
import { MediaCard } from "./MediaCard";
import { cn } from "@/lib/utils";

interface CategoryExplorerProps {
  title: string;
  category: "filme" | "serie" | "anime" | "dorama";
  genres: GenreItem[];
  items: EnrichedMedia[];
  activeGenre?: string;
  page?: number;
  hasMore?: boolean;
}

export function CategoryExplorer({
  title,
  category,
  genres,
  items,
  activeGenre,
  page = 1,
  hasMore = false,
}: CategoryExplorerProps) {
  const searchParams = useSearchParams();

  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Cabeçalho da Categoria */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-sm text-gray-400">
          Explore os títulos disponíveis no catálogo pessoal
        </p>
      </div>

      {/* Pílulas de filtro por Gênero */}
      {genres.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto plix-scrollbar pb-3 mb-8">
          <Link
            href={`/${category === "filme" ? "filmes" : category === "serie" ? "series" : category === "anime" ? "animes" : "doramas"}`}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer",
              !activeGenre
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "bg-surface-light/80 text-gray-300 hover:bg-surface-hover hover:text-white"
            )}
          >
            Todos os Gêneros
          </Link>

          {genres.slice(0, 20).map((g) => {
            const isSelected = activeGenre === g.slug;
            return (
              <Link
                key={g.id}
                href={`/${category === "filme" ? "filmes" : category === "serie" ? "series" : category === "anime" ? "animes" : "doramas"}?genero=${g.slug}`}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-surface-light/80 text-gray-300 hover:bg-surface-hover hover:text-white"
                )}
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Grid responsivo de Cards */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {items.map((item, idx) => (
            <div key={`${item.mediaType}-${item.id}`} className="flex justify-center">
              <MediaCard media={item} priority={idx < 6} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface/40 rounded-2xl border border-white/5 p-8">
          <p className="text-lg text-gray-300 mb-2">Nenhum título encontrado neste filtro.</p>
          <p className="text-sm text-gray-500">Tente selecionar outro gênero ou voltar para todos.</p>
        </div>
      )}

      {/* Paginação simples */}
      <div className="flex items-center justify-center gap-4 py-12">
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({
              ...(activeGenre ? { genero: activeGenre } : {}),
              page: String(page - 1),
            }).toString()}`}
            className="px-6 py-2.5 rounded-xl bg-surface-light hover:bg-surface-hover text-white text-sm font-semibold transition-colors border border-white/10"
          >
            Página Anterior
          </Link>
        )}

        <span className="text-xs text-gray-400 font-medium">Página {page}</span>

        {hasMore && (
          <Link
            href={`?${new URLSearchParams({
              ...(activeGenre ? { genero: activeGenre } : {}),
              page: String(page + 1),
            }).toString()}`}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-lg shadow-primary/25"
          >
            Próxima Página
          </Link>
        )}
      </div>
    </div>
  );
}
