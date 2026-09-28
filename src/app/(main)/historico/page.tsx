export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { History, Play, CheckCircle2, Film, Tv, Clock } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";

export default async function HistoricoPage() {
  const profile = await getCurrentProfile();

  const rawHistory = profile
    ? await prisma.watchHistory.findMany({
        where: { profileId: profile.id },
        orderBy: { lastWatchedAt: "desc" },
      })
    : [];

  const historyItems = await Promise.all(
    rawHistory.map(async (item) => {
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
            prisma.watchHistory
              .update({
                where: { id: item.id },
                data: { posterUrl: details.posterUrl, title: details.title },
              })
              .catch(() => {});
          }
        } catch (err) {
          console.warn(`Erro ao auto-enriquecer poster no histórico #${item.tmdbId}:`, err);
        }
      }

      return {
        ...item,
        posterUrl,
        title: title || item.title,
      };
    })
  );

  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen pb-16">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Histórico de Reprodução
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Acompanhe o que você começou ou concluiu
          </p>
        </div>
      </div>

      {historyItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyItems.map((item) => {
            const isMovie = item.mediaType === "FILME";
            const routeType = item.mediaType.toLowerCase();
            const playUrl = isMovie
              ? `/assistir/${routeType}/${item.tmdbId}`
              : `/assistir/${routeType}/${item.tmdbId}?s=${item.seasonNumber || 1}&e=${item.episodeNumber || 1}`;
            const detailsUrl = `/detalhes/${routeType}/${item.tmdbId}`;

            return (
              <div
                key={item.id}
                className="group flex gap-4 p-3 rounded-2xl bg-surface-card border border-white/5 hover:border-white/20 transition-all hover:bg-surface-hover"
              >
                {/* Poster / Thumbnail */}
                <Link
                  href={playUrl}
                  className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-surface-light group-hover:scale-105 transition-transform"
                >
                  {item.posterUrl ? (
                    <Image
                      src={item.posterUrl}
                      alt={item.title || "Poster"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      {isMovie ? <Film className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 fill-white text-white" />
                  </div>
                </Link>

                {/* Detalhes */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {item.mediaType}
                      </span>
                      {item.isCompleted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Assistido
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          Em andamento
                        </span>
                      )}
                    </div>

                    <Link
                      href={detailsUrl}
                      className="font-bold text-sm sm:text-base text-gray-100 hover:text-white line-clamp-1"
                    >
                      {item.title || `Item #${item.tmdbId}`}
                    </Link>

                    {!isMovie && item.seasonNumber && item.episodeNumber ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Temporada {item.seasonNumber} • Episódio {item.episodeNumber}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={playUrl}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{item.isCompleted ? "Assistir de novo" : "Continuar"}</span>
                    </Link>

                    <Link
                      href={detailsUrl}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface/30 rounded-2xl border border-white/5 p-8">
          <History className="w-16 h-16 text-gray-600 mb-4" />
          <h2 className="text-lg font-bold text-gray-200 mb-1">
            Nenhum histórico registrado
          </h2>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            Quando você começar a assistir filmes, episódios de séries, animes ou doramas, eles aparecerão aqui para você retomar facilmente.
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-lg shadow-primary/25"
          >
            Começar a Assistir
          </Link>
        </div>
      )}
    </div>
  );
}
