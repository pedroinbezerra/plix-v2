"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { MediaType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  tmdbId: string;
  mediaType: MediaType;
  title: string;
  posterUrl: string | null;
  initialInWatchlist?: boolean;
}

export function WatchlistButton({
  tmdbId,
  mediaType,
  title,
  posterUrl,
  initialInWatchlist = false,
}: WatchlistButtonProps) {
  const router = useRouter();
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/user/watchlist?tmdbId=${tmdbId}&mediaType=${mediaType}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && typeof data.inWatchlist === "boolean") {
          setInWatchlist(data.inWatchlist);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [tmdbId, mediaType]);

  const toggleWatchlist = async () => {
    if (loading) return;
    setLoading(true);

    // Otimista
    setInWatchlist((prev) => !prev);

    try {
      const res = await fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, mediaType, title, posterUrl }),
      });
      const data = await res.json();
      if (typeof data.inWatchlist === "boolean") {
        setInWatchlist(data.inWatchlist);
      }
      window.dispatchEvent(new CustomEvent("plix:data-updated"));
      router.refresh();
    } catch {
      // Reverte em caso de falha
      setInWatchlist((prev) => !prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={cn(
        "flex items-center gap-2.5 px-6 py-3.5 rounded-full font-medium text-sm sm:text-base backdrop-blur-2xl transition-all active:scale-95 cursor-pointer border shadow-sm",
        inWatchlist
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30"
          : "bg-white/15 text-white border-white/20 hover:bg-white/25"
      )}
    >
      {inWatchlist ? (
        <>
          <Check className="w-5 h-5 text-emerald-400" />
          <span>Na Minha Lista</span>
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          <span>Minha Lista</span>
        </>
      )}
    </button>
  );
}
