"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  Info,
  Share2,
  Link2,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaContextMenuProps {
  media: {
    id: string; // TMDB ID
    mediaType: "FILME" | "SERIE" | "ANIME" | "DORAMA" | string;
    title: string;
    posterUrl?: string | null;
    backdropUrl?: string | null;
    seasonNumber?: number;
    episodeNumber?: number;
    runtime?: number;
    isAnime?: boolean;
  };
  initialInWatchlist?: boolean;
  initialIsCompleted?: boolean;
  className?: string;
  triggerClassName?: string;
  menuPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "auto";
}

export function MediaContextMenu({
  media,
  initialInWatchlist,
  initialIsCompleted,
  className,
  triggerClassName,
  menuPosition = "auto",
}: MediaContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState<boolean>(initialInWatchlist ?? false);
  const [isCompleted, setIsCompleted] = useState<boolean>(initialIsCompleted ?? false);
  const [hasLoadedStatus, setHasLoadedStatus] = useState<boolean>(
    initialInWatchlist !== undefined && initialIsCompleted !== undefined
  );
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false);
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sincroniza props iniciais se mudarem
  useEffect(() => {
    if (initialInWatchlist !== undefined) setInWatchlist(initialInWatchlist);
    if (initialIsCompleted !== undefined) setIsCompleted(initialIsCompleted);
  }, [initialInWatchlist, initialIsCompleted]);

  // Listener para evento externo disparado pelo controle remoto (long press OK ou tecla Menu na Smart TV)
  useEffect(() => {
    const handleExternalOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail && String(customEvent.detail.id) === String(media.id)) {
        setIsOpen(true);
      }
    };

    window.addEventListener("plix:open-media-menu", handleExternalOpen);
    return () => window.removeEventListener("plix:open-media-menu", handleExternalOpen);
  }, [media.id]);

  // Ao abrir o menu, se os status não foram informados, consulta a API
  useEffect(() => {
    if (!isOpen || hasLoadedStatus) return;

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const [wlRes, histRes] = await Promise.all([
          fetch(
            `/api/user/watchlist?tmdbId=${encodeURIComponent(media.id)}&mediaType=${encodeURIComponent(media.mediaType)}`
          ).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/user/history`).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (isMounted) {
          if (wlRes && typeof wlRes.inWatchlist === "boolean") {
            setInWatchlist(wlRes.inWatchlist);
          }
          if (Array.isArray(histRes)) {
            const matched = histRes.find(
              (h: any) =>
                String(h.tmdbId) === String(media.id) &&
                h.mediaType === media.mediaType &&
                (media.seasonNumber !== undefined
                  ? h.seasonNumber === media.seasonNumber && h.episodeNumber === media.episodeNumber
                  : true)
            );
            if (matched) {
              setIsCompleted(!!matched.isCompleted);
            }
          }
          setHasLoadedStatus(true);
        }
      } catch (err) {
        console.warn("Erro ao carregar status do título para o menu:", err);
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [isOpen, hasLoadedStatus, media.id, media.mediaType, media.seasonNumber, media.episodeNumber]);

  // Calcula se o menu deve abrir para cima ou para baixo baseado na viewport
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    if (menuPosition === "top-right" || menuPosition === "top-left") {
      setOpenUpward(true);
      return;
    }
    if (menuPosition === "bottom-right" || menuPosition === "bottom-left") {
      setOpenUpward(false);
      return;
    }

    // "auto": calcula a posição no viewport
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedMenuHeight = 220;
    setOpenUpward(spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight);
  }, [isOpen, menuPosition]);

  // Auto-foco no primeiro item do menu ao abrir para Smart TVs e navegação por D-pad
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (menuRef.current) {
        const firstFocusable = menuRef.current.querySelector<HTMLElement>("button, a");
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Navegação por teclado / controle remoto (D-Pad) dentro do menu aberto e fechamento suave
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isBackKey =
        e.key === "Escape" ||
        e.key === "Backspace" ||
        e.key === "GoBack" ||
        e.keyCode === 10009 || // Tizen Return
        e.keyCode === 461 ||   // webOS Back
        e.keyCode === 4;       // Android TV Back

      if (isBackKey) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!menuRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const items = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>("button, a")
        );
        if (items.length === 0) return;

        const currentActive = document.activeElement as HTMLElement;
        const currentIndex = items.indexOf(currentActive);

        if (e.key === "ArrowDown") {
          const nextIndex = currentIndex === -1 || currentIndex === items.length - 1 ? 0 : currentIndex + 1;
          items[nextIndex]?.focus();
        } else if (e.key === "ArrowUp") {
          const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          items[prevIndex]?.focus();
        }
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Previne navegação fora do menu enquanto estiver aberto
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  const routeType = media.mediaType.toLowerCase();
  const detailsHref = `/detalhes/${routeType}/${media.id}`;

  // 1. Quero Assistir (Adicionar / Remover)
  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdatingWatchlist) return;

    setIsUpdatingWatchlist(true);
    try {
      const res = await fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: media.id,
          mediaType: media.mediaType,
          title: media.title,
          posterUrl: media.posterUrl || media.backdropUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInWatchlist(!!data.inWatchlist);
        window.dispatchEvent(new CustomEvent("plix:data-updated"));
      }
    } catch (err) {
      console.error("Erro ao alterar Quero Assistir:", err);
    } finally {
      setIsUpdatingWatchlist(false);
      setIsOpen(false);
    }
  };

  // 2. Marcar como Assistido / Não Assistido
  const handleToggleWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdatingHistory) return;

    setIsUpdatingHistory(true);
    const nextCompleted = !isCompleted;
    try {
      const res = await fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: media.id,
          mediaType: media.mediaType,
          seasonNumber: media.seasonNumber ?? 0,
          episodeNumber: media.episodeNumber ?? 0,
          isCompleted: nextCompleted,
          title: media.title,
          posterUrl: media.posterUrl || media.backdropUrl,
        }),
      });

      if (res.ok) {
        setIsCompleted(nextCompleted);
        window.dispatchEvent(new CustomEvent("plix:data-updated"));
      }
    } catch (err) {
      console.error("Erro ao marcar como assistido:", err);
    } finally {
      setIsUpdatingHistory(false);
      setIsOpen(false);
    }
  };

  // 3. Compartilhar
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${detailsHref}`;
    const shareTitle = media.title;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Assista a "${shareTitle}" no Plix`,
          url: shareUrl,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      // Fallback para cópia
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error("Falha ao copiar link");
      }
    }
    setIsOpen(false);
  };

  // 4. Copiar link
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = `${window.location.origin}${detailsHref}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
    setTimeout(() => setIsOpen(false), 700);
  };

  const getMediaTypeName = () => {
    switch (media.mediaType) {
      case "FILME":
        return "o filme";
      case "SERIE":
        return "a série";
      case "ANIME":
        return "o anime";
      case "DORAMA":
        return "o dorama";
      default:
        return "o título";
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block select-none", className)}
      onClick={(e) => {
        // Impede que cliques na área do menu propaguem para links de cards pais
        e.stopPropagation();
      }}
    >
      {/* Botão de Três Pontinhos (•••) */}
      <button
        ref={triggerRef}
        type="button"
        data-menu-trigger="true"
        data-media-id={String(media.id)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl border border-white/15",
          "focus:outline-none focus-visible:scale-125 focus-visible:bg-white focus-visible:text-black focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:shadow-[0_0_25px_rgba(255,255,255,0.9)] focus-visible:z-40",
          isOpen
            ? "bg-white text-black shadow-lg scale-110 border-white ring-2 ring-white/80"
            : "bg-black/60 hover:bg-black/85 active:bg-white active:text-black text-white/90 hover:text-white hover:border-white/40 shadow-md",
          triggerClassName
        )}
        aria-label={`Opções de ${media.title}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Popover do Menu Contextual Estilo Apple TV Glass */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          data-media-menu-open="true"
          className={cn(
            "absolute z-50 min-w-[240px] sm:min-w-[260px] bg-[#1a1b24]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-1.5 text-xs text-white animate-fade-in",
            openUpward ? "bottom-full mb-2" : "top-full mt-2",
            menuPosition === "bottom-left" || menuPosition === "top-left"
              ? "left-0"
              : "right-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Quero Assistir */}
          <button
            type="button"
            role="menuitem"
            tabIndex={0}
            onClick={handleToggleWatchlist}
            disabled={isUpdatingWatchlist}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:text-white focus:outline-none focus:ring-1 focus:ring-white/40 active:bg-white/15 transition-colors text-left cursor-pointer group/item disabled:opacity-50"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {inWatchlist ? "Remover de Quero Assistir" : "Adicionar a Quero Assistir"}
            </span>
            {isUpdatingWatchlist ? (
              <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
            ) : inWatchlist ? (
              <MinusCircle className="w-4 h-4 text-white/60 group-hover/item:text-white" />
            ) : (
              <PlusCircle className="w-4 h-4 text-white/60 group-hover/item:text-white" />
            )}
          </button>

          {/* 2. Marcar como Assistido */}
          <button
            type="button"
            role="menuitem"
            tabIndex={0}
            onClick={handleToggleWatched}
            disabled={isUpdatingHistory}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:text-white focus:outline-none focus:ring-1 focus:ring-white/40 active:bg-white/15 transition-colors text-left cursor-pointer group/item disabled:opacity-50"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {isCompleted ? "Marcar como não assistido" : "Marcar como assistido"}
            </span>
            {isUpdatingHistory ? (
              <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
            ) : (
              <CheckCircle2
                className={cn(
                  "w-4 h-4",
                  isCompleted ? "text-emerald-400" : "text-white/60 group-hover/item:text-white"
                )}
              />
            )}
          </button>

          {/* 3. Ir para detalhes */}
          <Link
            href={detailsHref}
            role="menuitem"
            tabIndex={0}
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:text-white focus:outline-none focus:ring-1 focus:ring-white/40 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {media.seasonNumber !== undefined && media.episodeNumber !== undefined
                ? "Ver detalhes da série"
                : `Ir para ${getMediaTypeName()}`}
            </span>
            <Info className="w-4 h-4 text-white/60 group-hover/item:text-white" />
          </Link>

          {/* 4. Compartilhar */}
          <button
            type="button"
            role="menuitem"
            tabIndex={0}
            onClick={handleShare}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:text-white focus:outline-none focus:ring-1 focus:ring-white/40 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              Compartilhar
            </span>
            <Share2 className="w-4 h-4 text-white/60 group-hover/item:text-white" />
          </button>

          {/* 5. Copiar Link */}
          <button
            type="button"
            role="menuitem"
            tabIndex={0}
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 focus:bg-white/20 focus:text-white focus:outline-none focus:ring-1 focus:ring-white/40 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {copied ? "Link copiado!" : "Copiar link"}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Link2 className="w-4 h-4 text-white/60 group-hover/item:text-white" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
