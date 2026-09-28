"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { MediaCard } from "./MediaCard";
import { LandscapeMediaCard } from "./LandscapeMediaCard";

interface MediaRowProps {
  title: string;
  items: EnrichedMedia[];
  viewAllHref?: string;
  priority?: boolean;
  isLandscape?: boolean;
}

export function MediaRow({
  title,
  items,
  viewAllHref,
  priority = false,
  isLandscape = false,
}: MediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative my-7 sm:my-10 px-4 sm:px-8 group/row">
      {/* Cabeçalho da fileira estilo Apple TV */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span>{title}</span>
          <span className="text-[11px] text-white/50 font-normal px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {items.length}
          </span>
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all cursor-pointer"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
        )}
      </div>

      {/* Botões de navegação lateral (Desktop) em Apple Glass */}
      <button
        onClick={() => scroll("left")}
        aria-label="Rolar para esquerda"
        className="hidden md:flex absolute left-2 top-[55%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-xl shadow-2xl border border-white/15 cursor-pointer active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        aria-label="Rolar para direita"
        className="hidden md:flex absolute right-2 top-[55%] -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-xl shadow-2xl border border-white/15 cursor-pointer active:scale-95"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Container horizontal com scroll */}
      <div
        ref={rowRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto plix-scrollbar py-3 px-1 snap-x scroll-smooth focus:outline-none"
      >
        {items.map((item, idx) => (
          <div key={`${item.mediaType}-${item.id}`} className="snap-start">
            {isLandscape ? (
              <LandscapeMediaCard media={item} priority={priority && idx < 3} />
            ) : (
              <MediaCard media={item} priority={priority && idx < 4} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
