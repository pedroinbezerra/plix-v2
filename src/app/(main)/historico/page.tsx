export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { History, Play, CheckCircle2, Clock } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { HistoryThumbnail } from "@/components/media/HistoryThumbnail";
import { MediaContextMenu } from "@/components/media/MediaContextMenu";
import { formatMediaDuration } from "@/lib/utils";

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
      let runtime = 0;
      let seasonsCount: number | undefined;
      let episodesCount: number | undefined;

      try {
        const details = await metadataProvider.getDetails(item.tmdbId, item.mediaType);
        if (details) {
          if (details.posterUrl) posterUrl = details.posterUrl;
          if (!title || title.startsWith("Item #")) title = details.title;
          if (details.runtime) runtime = details.runtime;
          if (details.seasonsCount) seasonsCount = details.seasonsCount;
          if (details.episodesCount) episodesCount = details.episodesCount;

          // Autocura no banco se poster ou título estavam ausentes
          if (!item.posterUrl || item.posterUrl !== posterUrl || !item.title) {
            prisma.watchHistory
              .update({
                where: { id: item.id },
                data: { posterUrl, title },
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.warn(`Erro ao auto-enriquecer item no histórico #${item.tmdbId}:`, err);
      }

      return {
        ...item,
        posterUrl,
        title: title || item.title,
        runtime,
        seasonsCount,
        episodesCount,
      };
    })
  );

  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen pb-16">
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-lg">
          <History className="w-6 h-6 text-white" />
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

            const badgeColor =
              item.mediaType === "FILME"
                ? "bg-blue-500/15 text-blue-300 border-blue-400/25"
                : item.mediaType === "SERIE"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/25"
                : item.mediaType === "ANIME"
                ? "bg-purple-500/15 text-purple-300 border-purple-400/25"
                : "bg-rose-500/15 text-rose-300 border-rose-400/25";

            const durationText = formatMediaDuration({
              mediaType: item.mediaType,
              runtime: item.runtime,
              seasonsCount: item.seasonsCount,
              episodesCount: item.episodesCount,
              seasonNumber: item.seasonNumber,
              episodeNumber: item.episodeNumber,
            });

            return (
              <div
                key={item.id}
                className="group relative flex gap-4 p-3.5 rounded-2xl apple-glass-card hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-lg"
              >
                {/* Poster / Thumbnail */}
                <Link
                  href={playUrl}
                  className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:scale-105 transition-transform"
                >
                  <HistoryThumbnail
                    tmdbId={item.tmdbId}
                    mediaType={item.mediaType}
                    initialPosterUrl={item.posterUrl}
                    title={item.title}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </Link>

                {/* Detalhes */}
                <div className="flex-1 flex flex-col justify-between py-1 pr-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
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

                      {/* Indicador de Tempo Total */}
                      {durationText ? (
                        <span className="flex items-center gap-1 text-[11px] text-white/70 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          <Clock className="w-3 h-3 text-white/50" />
                          <span>{durationText}</span>
                        </span>
                      ) : null}
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

                  <div className="flex items-center gap-2.5 pt-2">
                    <Link
                      href={playUrl}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>{item.isCompleted ? "Assistir de novo" : "Continuar"}</span>
                    </Link>

                    <Link
                      href={detailsUrl}
                      className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white transition-all border border-white/10"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>

                {/* Menu de Três Pontinhos (•••) Padronizado no Histórico */}
                <div className="absolute top-3 right-3 z-30">
                  <MediaContextMenu
                    media={{
                      id: item.tmdbId,
                      mediaType: item.mediaType,
                      title: item.title || `Item #${item.tmdbId}`,
                      posterUrl: item.posterUrl,
                      seasonNumber: item.seasonNumber,
                      episodeNumber: item.episodeNumber,
                      runtime: item.runtime,
                    }}
                    initialIsCompleted={item.isCompleted}
                    menuPosition="auto"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center apple-glass-card rounded-3xl p-10 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-white/50" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Nenhum histórico registrado
          </h2>
          <p className="text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
            Quando você começar a assistir filmes, episódios de séries, animes ou doramas, eles aparecerão aqui para você retomar facilmente.
          </p>
          <Link
            href="/"
            className="px-7 py-3 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-sm font-bold transition-all shadow-xl cursor-pointer"
          >
            Começar a Assistir
          </Link>
        </div>
      )}
    </div>
  );
}
