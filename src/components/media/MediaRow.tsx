"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { MediaCard } from "./MediaCard";
import { LandscapeMediaCard } from "./LandscapeMediaCard";
import { cn } from "@/lib/utils";

interface MediaRowProps {
  title: string;
  items: EnrichedMedia[];
  viewAllHref?: string;
  priority?: boolean;
  isLandscape?: boolean;
}

// Margens da Janela Deslizante (Sliding Window):
// - 1 item retido no buffer esquerdo (para voltar sem atraso)
// - 2 itens pré-carregados no buffer direito (para avanço fluido)
const BUFFER_LEFT = 1;
const BUFFER_RIGHT = 2;

export function MediaRow({
  title,
  items: rawItems,
  viewAllHref,
  priority = false,
  isLandscape = false,
}: MediaRowProps) {
  // Garante itens únicos por mediaType e id para evitar colisões de chave e duplicações no carrossel
  const items = useMemo(() => {
    if (!rawItems || rawItems.length === 0) return [];
    const seen = new Set<string>();
    return rawItems.filter((item) => {
      const key = `${item.mediaType}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawItems]);

  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const savedScrollLeftRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // 1. Gerenciamento Vertical: Lazy Mounting da Seção
  // Linhas prioritárias (acima da dobra) montam imediatamente.
  // Linhas fora da tela só montam quando o usuário se aproxima (450px de margem).
  const [isSectionVisible, setIsSectionVisible] = useState(priority);

  useEffect(() => {
    if (priority) {
      setIsSectionVisible(true);
      return;
    }

    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsSectionVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsSectionVisible(entry.isIntersecting);
        });
      },
      { rootMargin: "450px 0px 450px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  // 2. Medidas Dinâmicas (Largura do Card + Gap)
  const [cardStride, setCardStride] = useState<number>(() => {
    return isLandscape ? 320 + 16 : 195 + 16;
  });

  const computeRange = useCallback(
    (scrollLeft: number, clientWidth: number, stride: number, total: number) => {
      if (stride <= 0 || total <= 0) {
        return { start: 0, end: total };
      }
      // Se a lista inteira for curta (até 6 itens), renderiza completa sem desmontar
      if (total <= 6) {
        return { start: 0, end: total };
      }

      const visibleCount = Math.max(1, Math.ceil(clientWidth / stride));
      const firstVisible = Math.max(0, Math.floor(scrollLeft / stride));
      const lastVisible = Math.min(total - 1, firstVisible + visibleCount - 1);

      const start = Math.max(0, firstVisible - BUFFER_LEFT);
      const end = Math.min(total, lastVisible + 1 + BUFFER_RIGHT);

      return { start, end };
    },
    []
  );

  // Janela deslizante de índices [start, end)
  const [range, setRange] = useState<{ start: number; end: number }>(() => ({
    start: 0,
    end: Math.min(items?.length || 0, 7),
  }));

  const updateMeasurements = useCallback(() => {
    if (!rowRef.current) return;
    const firstCard = rowRef.current.querySelector<HTMLElement>("[data-card-slot]");
    if (firstCard) {
      const width = firstCard.offsetWidth;
      const nextCard = firstCard.nextElementSibling as HTMLElement | null;
      let gap = 16;
      if (nextCard) {
        gap = Math.max(0, nextCard.offsetLeft - (firstCard.offsetLeft + width));
      }
      if (width > 0) {
        setCardStride(width + (gap || 16));
      }
    }
  }, []);

  // Monitora resize do carrossel e restaura scroll horizontal se foi desmontado previamente
  useEffect(() => {
    if (!isSectionVisible || !rowRef.current) return;

    if (savedScrollLeftRef.current > 0) {
      rowRef.current.scrollLeft = savedScrollLeftRef.current;
    }

    updateMeasurements();

    const updateFromCurrentState = () => {
      if (!rowRef.current) return;
      const { scrollLeft, clientWidth } = rowRef.current;
      setRange(computeRange(scrollLeft, clientWidth, cardStride, items.length));
    };

    updateFromCurrentState();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
      updateFromCurrentState();
    });

    resizeObserver.observe(rowRef.current);
    return () => resizeObserver.disconnect();
  }, [isSectionVisible, updateMeasurements, cardStride, items.length, computeRange]);

  // Atualização fluida do Scroll sincronizada com requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (rafIdRef.current) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!rowRef.current) return;
      const { scrollLeft, clientWidth } = rowRef.current;
      savedScrollLeftRef.current = scrollLeft;

      const nextRange = computeRange(scrollLeft, clientWidth, cardStride, items.length);
      setRange((prev) => {
        if (prev.start === nextRange.start && prev.end === nextRange.end) {
          return prev;
        }
        return nextRange;
      });
    });
  }, [cardStride, items.length, computeRange]);

  // Se um card receber foco (controle remoto Smart TV ou Tab), garante ele e os buffers no DOM
  const handleFocusCapture = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const slot = target.closest<HTMLElement>("[data-media-index]");
    if (slot && slot.dataset.mediaIndex) {
      const idx = parseInt(slot.dataset.mediaIndex, 10);
      if (!isNaN(idx) && rowRef.current) {
        const { scrollLeft, clientWidth } = rowRef.current;
        const currentRange = computeRange(scrollLeft, clientWidth, cardStride, items.length);
        const forcedStart = Math.max(0, Math.min(currentRange.start, idx - BUFFER_LEFT));
        const forcedEnd = Math.min(items.length, Math.max(currentRange.end, idx + 1 + BUFFER_RIGHT));
        if (forcedStart !== currentRange.start || forcedEnd !== currentRange.end) {
          setRange({ start: forcedStart, end: forcedEnd });
        }
      }
    }
  };

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

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative my-7 sm:my-10 px-4 sm:px-8 group/row",
        isLandscape
          ? "min-h-[220px] sm:min-h-[260px] md:min-h-[290px] lg:min-h-[310px]"
          : "min-h-[290px] sm:min-h-[350px] md:min-h-[385px] lg:min-h-[410px]"
      )}
    >
      {/* Cabeçalho da fileira estilo Apple TV */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
          {title}
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
      {isSectionVisible && (
        <>
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
        </>
      )}

      {/* Carrossel Ativo Virtualizado ou Placeholder Leve da Seção */}
      {isSectionVisible ? (
        <div
          ref={rowRef}
          onScroll={handleScroll}
          onFocusCapture={handleFocusCapture}
          className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar py-3 px-1 snap-x scroll-smooth focus:outline-none"
        >
          {items.map((item, idx) => {
            const isRendered = idx >= range.start && idx < range.end;

            return (
              <div
                key={`${item.mediaType}-${item.id}`}
                data-card-slot="true"
                data-media-index={idx}
                className={cn(
                  "snap-start flex-shrink-0",
                  isLandscape
                    ? "w-[240px] sm:w-[280px] md:w-[320px] lg:w-[350px]"
                    : "w-[140px] sm:w-[170px] md:w-[195px] lg:w-[210px]"
                )}
              >
                {isRendered ? (
                  isLandscape ? (
                    <LandscapeMediaCard
                      media={item}
                      priority={priority && idx < 3}
                      className="w-full"
                    />
                  ) : (
                    <MediaCard
                      media={item}
                      priority={priority && idx < 4}
                      className="w-full"
                    />
                  )
                ) : (
                  /* Slot descartado: preserva a geometria física exata sem sobrecarregar DOM e VRAM */
                  <div
                    className={cn(
                      "w-full rounded-2xl border border-transparent select-none pointer-events-none flex flex-col",
                      isLandscape ? "aspect-video" : ""
                    )}
                    aria-hidden="true"
                  >
                    {!isLandscape && (
                      <>
                        <div className="w-full aspect-[2/3] rounded-t-2xl bg-white/[0.02]" />
                        <div className="p-2.5 sm:p-3 h-[54px]" />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Placeholder esqueleto da seção quando fora de alcance vertical */
        <div
          className={cn(
            "flex gap-3 sm:gap-4 overflow-hidden py-3 px-1",
            isLandscape
              ? "min-h-[170px] sm:min-h-[200px] md:min-h-[225px] lg:min-h-[245px]"
              : "min-h-[220px] sm:min-h-[270px] md:min-h-[310px] lg:min-h-[330px]"
          )}
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-shrink-0 rounded-2xl bg-white/[0.02] border border-white/[0.04]",
                isLandscape
                  ? "w-[240px] sm:w-[280px] md:w-[320px] lg:w-[350px] aspect-video"
                  : "w-[140px] sm:w-[170px] md:w-[195px] lg:w-[210px] aspect-[2/3]"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
