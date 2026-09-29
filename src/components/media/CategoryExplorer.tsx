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
  category: "filme" | "serie" | "anime" | "dorama" | "desenho";
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

  const getCategoryPath = (cat: string) => {
    switch (cat) {
      case "filme":
        return "filmes";
      case "serie":
        return "series";
      case "anime":
        return "animes";
      case "desenho":
        return "desenhos";
      default:
        return "doramas";
    }
  };

  const basePath = `/${getCategoryPath(category)}`;

  return (
    <div className="pt-24 sm:pt-28 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Cabeçalho da Categoria */}
      <div className="mb-7 sm:mb-9">
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2.5">
          {title}
        </h1>
        <p className="text-sm text-white/60">
          Explore os títulos disponíveis no catálogo pessoal
        </p>
      </div>

      {/* Pílulas de filtro por Gênero (Apple TV Capsule Filter Bar) */}
      {genres.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mb-9">
          <Link
            href={basePath}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer backdrop-blur-xl border",
              !activeGenre
                ? "bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                : "bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white border-white/10"
            )}
          >
            Todos os Gêneros
          </Link>

          {genres.slice(0, 20).map((g) => {
            const isSelected = activeGenre === g.slug;
            return (
              <Link
                key={g.id}
                href={`${basePath}?genero=${g.slug}`}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer backdrop-blur-xl border",
                  isSelected
                    ? "bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                    : "bg-white/[0.08] hover:bg-white/[0.16] text-white/80 hover:text-white border-white/10"
                )}
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Grid responsivo de Cards com proporções e cantos arredondados Apple TV */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {items.map((item, idx) => (
            <MediaCard
              key={`${item.mediaType}-${item.id}`}
              media={item}
              priority={idx < 6}
              className="w-full"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-surface-card/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <p className="text-lg font-semibold text-white/90 mb-2">Nenhum título encontrado neste filtro.</p>
          <p className="text-sm text-white/50">Tente selecionar outro gênero ou voltar para todos.</p>
        </div>
      )}

      {/* Paginação estilo Apple TV Pills */}
      <div className="flex items-center justify-center gap-4 py-14">
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({
              ...(activeGenre ? { genero: activeGenre } : {}),
              page: String(page - 1),
            }).toString()}`}
            className="px-7 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white text-sm font-semibold transition-all border border-white/15 backdrop-blur-xl cursor-pointer active:scale-95"
          >
            Página Anterior
          </Link>
        )}

        <span className="text-xs text-white/60 font-medium px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
          Página {page}
        </span>

        {hasMore && (
          <Link
            href={`?${new URLSearchParams({
              ...(activeGenre ? { genero: activeGenre } : {}),
              page: String(page + 1),
            }).toString()}`}
            className="px-7 py-3 rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold transition-all shadow-[0_8px_25px_rgba(255,255,255,0.25)] cursor-pointer active:scale-95"
          >
            Próxima Página
          </Link>
        )}
      </div>
    </div>
  );
}
