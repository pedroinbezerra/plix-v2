"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Play,
  Film,
  Tv,
  MoreHorizontal,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  Info,
  Share2,
  Link2,
  Check,
} from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { formatMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { isJapaneseAnime } from "@/lib/media-classifier";

interface LandscapeMediaCardProps {
  media: EnrichedMedia | {
    id: string;
    mediaType: "FILME" | "SERIE" | "ANIME" | "DORAMA";
    title: string;
    posterUrl: string | null;
    backdropUrl?: string | null;
    overview?: string;
    releaseYear?: string;
    voteAverage?: number;
    seasonNumber?: number;
    episodeNumber?: number;
    progressPercent?: number; // 0 a 100
    runtime?: number;
  };
  priority?: boolean;
  className?: string;
}

export function LandscapeMediaCard({
  media,
  priority = false,
  className,
}: LandscapeMediaCardProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [currentBackdrop, setCurrentBackdrop] = useState(
    media.backdropUrl || media.posterUrl
  );
  const [currentTitle, setCurrentTitle] = useState(media.title);
  const [currentReleaseYear, setCurrentReleaseYear] = useState(media.releaseYear || "");
  const [currentRuntime, setCurrentRuntime] = useState<number>("runtime" in media ? media.runtime || 0 : 0);
  const [imageError, setImageError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Estados do Menu Contextual (•••)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(true); // Se está no Up Next / continuar, assume na lista
  const [isCompleted, setIsCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentBackdrop(media.backdropUrl || media.posterUrl);
    setCurrentTitle(media.title);
    if (media.releaseYear) setCurrentReleaseYear(media.releaseYear);
    if ("runtime" in media && media.runtime) setCurrentRuntime(media.runtime);
  }, [media.backdropUrl, media.posterUrl, media.title, media.releaseYear, "runtime" in media ? media.runtime : null]);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Autocura de metadados: Se o backdrop ou duração estiverem ausentes, busca do TMDB
  useEffect(() => {
    const isInvalid = !currentBackdrop || currentBackdrop.includes("test.jpg") || imageError;

    if ((isInvalid || currentRuntime === 0) && !isRecovering && media.id && media.mediaType) {
      setIsRecovering(true);
      fetch(
        `/api/catalog/poster?tmdbId=${encodeURIComponent(media.id)}&mediaType=${encodeURIComponent(media.mediaType)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const nextImg = data.backdropUrl || data.posterUrl;
            if (nextImg && nextImg !== currentBackdrop) {
              setCurrentBackdrop(nextImg);
              setImageError(false);
            }
            if (data.title && (!currentTitle || currentTitle.startsWith("Item #"))) {
              setCurrentTitle(data.title);
            }
            if (data.releaseYear && !currentReleaseYear) {
              setCurrentReleaseYear(data.releaseYear);
            }
            if (data.runtime && currentRuntime === 0) {
              setCurrentRuntime(data.runtime);
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsRecovering(false));
    }
  }, [currentBackdrop, imageError, media.id, media.mediaType, isRecovering, currentTitle, currentReleaseYear, currentRuntime]);

  const isAnimeType = media.mediaType === "ANIME";
  const isRealAnime = isAnimeType ? isJapaneseAnime(media as any) : false;
  const displayType = isAnimeType ? (isRealAnime ? "ANIME" : "DESENHO") : media.mediaType;

  const routeType = displayType === "DESENHO" ? "desenho" : media.mediaType.toLowerCase();
  const sNum = "seasonNumber" in media ? media.seasonNumber : undefined;
  const eNum = "episodeNumber" in media ? media.episodeNumber : undefined;
  const isSeries = media.mediaType !== "FILME";

  const playHref = isSeries && sNum && eNum
    ? `/assistir/${routeType}/${media.id}?s=${sNum}&e=${eNum}`
    : `/assistir/${routeType}/${media.id}`;
  const detailsHref = `/detalhes/${routeType}/${media.id}`;

  // Formatação do status inferior esquerdo estilo Apple TV
  const renderStatus = () => {
    if (isSeries && sNum && eNum) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
          <Play className="w-3 h-3 fill-white text-white" />
          <span>
            T{sNum}, E{eNum}
            {currentRuntime > 0 ? ` • ${formatMinutes(currentRuntime)}` : ""}
          </span>
        </span>
      );
    }

    if (!isSeries && currentRuntime > 0) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
          <Play className="w-3 h-3 fill-white text-white" />
          <span>{formatMinutes(currentRuntime)}</span>
        </span>
      );
    }

    return (
      <span className="text-xs text-white/90 font-medium">
        Em Quero Assistir
      </span>
    );
  };

  // 1. Remover/Adicionar da Lista Quero Assistir
  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: media.id,
          mediaType: media.mediaType,
          title: currentTitle || media.title,
          posterUrl: currentBackdrop,
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
      setIsMenuOpen(false);
    }
  };

  // 2. Marcar como Assistido
  const handleMarkWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const nextCompleted = !isCompleted;
      const res = await fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: media.id,
          mediaType: media.mediaType,
          seasonNumber: sNum,
          episodeNumber: eNum,
          isCompleted: nextCompleted,
          title: currentTitle || media.title,
          posterUrl: currentBackdrop,
        }),
      });
      if (res.ok) {
        setIsCompleted(nextCompleted);
        window.dispatchEvent(new CustomEvent("plix:data-updated"));
      }
    } catch (err) {
      console.error("Erro ao marcar como assistido:", err);
    } finally {
      setIsMenuOpen(false);
    }
  };

  // 3. Compartilhar
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${detailsHref}`;
    const shareTitle = currentTitle || media.title;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Assista a "${shareTitle}" no Plix`,
          url: shareUrl,
        });
      } catch {
        // Usuário cancelou ou navegador não completou
      }
    } else {
      // Fallback: copia para o clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error("Falha ao copiar link");
      }
    }
    setIsMenuOpen(false);
  };

  // 4. Copiar link direto
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
    setTimeout(() => setIsMenuOpen(false), 800);
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        "group relative rounded-2xl overflow-visible transition-all duration-300 block select-none",
        className ? className : "flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] lg:w-[350px]"
      )}
    >
      <Link
        href={playHref}
        tabIndex={0}
        className={cn(
          "relative aspect-video w-full rounded-2xl overflow-hidden bg-[#14151e] border border-white/[0.08] block",
          "hover:scale-[1.03] hover:shadow-[0_20px_45px_rgba(0,0,0,0.85)] hover:border-white/30 hover:z-30 transition-all duration-300",
          "focus-visible:scale-[1.04] focus-visible:shadow-tv focus-visible:border-white focus-visible:z-40 outline-none"
        )}
      >
        {/* Imagem de Backdrop */}
        {currentBackdrop && !imageError ? (
          <Image
            src={currentBackdrop}
            alt={currentTitle || media.title}
            fill
            sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, (max-width: 1024px) 320px, 350px"
            priority={priority}
            onError={() => setImageError(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#121319] to-background text-gray-500">
            {media.mediaType === "FILME" ? (
              <Film className="w-8 h-8 mb-1.5 text-gray-500" />
            ) : (
              <Tv className="w-8 h-8 mb-1.5 text-gray-500" />
            )}
            <span className="text-xs font-semibold text-gray-300 line-clamp-2">
              {currentTitle || media.title}
            </span>
          </div>
        )}

        {/* Gradiente sutil inferior no cartão */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Frosted Play button central estilo Apple TV ao passar o mouse */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl transform translate-y-1 group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Barra de Status Inferior Estilo Apple TV (Duração/Status à esquerda, ••• à direita) */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 py-2.5 flex items-center justify-between z-20">
          <div className="drop-shadow">
            {renderStatus()}
          </div>

          {/* Botão de Três Pontinhos (•••) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
              isMenuOpen
                ? "bg-white text-black shadow-md"
                : "bg-black/50 hover:bg-white/20 text-white/80 hover:text-white"
            )}
            aria-label="Opções do título"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progresso Apple TV (Up Next Progress) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
          <div
            className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  15,
                  "progressPercent" in media && media.progressPercent
                    ? media.progressPercent
                    : 45
                )
              )}%`,
            }}
          />
        </div>
      </Link>

      {/* Menu Contextual Estilo Apple TV (Popover) */}
      {isMenuOpen && (
        <div className="absolute right-0 bottom-12 z-50 min-w-[260px] bg-[#1a1b24] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-1.5 text-xs text-white animate-fade-in">
          {/* 1. Remover / Adicionar Quero Assistir */}
          <button
            onClick={handleToggleWatchlist}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {inWatchlist ? "Remover da lista Quero Assistir" : "Adicionar à lista Quero Assistir"}
            </span>
            {inWatchlist ? (
              <MinusCircle className="w-4 h-4 text-white/60 group-hover/item:text-white" />
            ) : (
              <PlusCircle className="w-4 h-4 text-white/60 group-hover/item:text-white" />
            )}
          </button>

          {/* 2. Marcar como Assistido */}
          <button
            onClick={handleMarkWatched}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {isCompleted ? "Marcar como não assistido" : "Marcar como assistido"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-white/60 group-hover/item:text-white" />
          </button>

          {/* 3. Ir para o filme / série */}
          <Link
            href={detailsHref}
            onClick={() => setIsMenuOpen(false)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              {media.mediaType === "FILME" ? "Ir para o filme" : "Ir para a série"}
            </span>
            <Info className="w-4 h-4 text-white/60 group-hover/item:text-white" />
          </Link>

          {/* 4. Compartilhar */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
          >
            <span className="font-medium text-gray-200 group-hover/item:text-white">
              Compartilhar
            </span>
            <Share2 className="w-4 h-4 text-white/60 group-hover/item:text-white" />
          </button>

          {/* 5. Copiar link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer group/item"
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
