"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { MediaCard } from "./MediaCard";

interface MediaRowProps {
  title: string;
  items: EnrichedMedia[];
  viewAllHref?: string;
  priority?: boolean;
}

export function MediaRow({
  title,
  items,
  viewAllHref,
  priority = false,
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
    <section className="relative my-6 sm:my-8 px-4 sm:px-8 group/row">
      {/* Cabeçalho da fileira */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs text-gray-500 font-normal">({items.length})</span>
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Ver todos
          </Link>
        )}
      </div>

      {/* Botões de navegação lateral (Desktop) */}
      <button
        onClick={() => scroll("left")}
        aria-label="Rolar para esquerda"
        className="hidden md:flex absolute left-2 top-[55%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-md shadow-xl border border-white/10 cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        aria-label="Rolar para direita"
        className="hidden md:flex absolute right-2 top-[55%] -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-md shadow-xl border border-white/10 cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Container horizontal com scroll */}
      <div
        ref={rowRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto plix-scrollbar py-2 px-1 snap-x scroll-smooth focus:outline-none"
      >
        {items.map((item, idx) => (
          <div key={`${item.mediaType}-${item.id}`} className="snap-start">
            <MediaCard media={item} priority={priority && idx < 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
