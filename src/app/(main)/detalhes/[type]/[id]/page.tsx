export const dynamic = "force-dynamic";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Star, Clock, Calendar, CheckCircle2, Film, Tv } from "lucide-react";
import { MediaType } from "@prisma/client";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { EpisodeDetails } from "@/providers/metadata/types";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatMinutes } from "@/lib/utils";
import { isJapaneseAnime } from "@/lib/media-classifier";
import { cn } from "@/lib/utils";
import { WatchlistButton } from "@/components/media/WatchlistButton";
import { SeasonEpisodeSelector } from "@/components/media/SeasonEpisodeSelector";

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function DetalhesPage({ params }: PageProps) {
  const { type, id } = await params;
  const normalizedType = type.toUpperCase();

  const validTypes: Record<string, MediaType> = {
    FILME: "FILME",
    SERIE: "SERIE",
    ANIME: "ANIME",
    DORAMA: "DORAMA",
    DESENHO: "ANIME",
    DESENHOS: "ANIME",
  };

  const mediaType = validTypes[normalizedType];
  if (!mediaType) {
    notFound();
  }

  const media = await metadataProvider.getDetails(id, mediaType);
  const profile = await getCurrentProfile();

  // Verifica estado de histórico e lista
  let inWatchlist = false;
  let lastWatchedHistory = null;

  if (profile) {
    try {
      const [wlItem, historyItem] = await Promise.all([
        prisma.watchlistItem.findUnique({
          where: {
            profileId_mediaType_tmdbId: {
              profileId: profile.id,
              mediaType,
              tmdbId: id,
            },
          },
        }),
        prisma.watchHistory.findFirst({
          where: {
            profileId: profile.id,
            mediaType,
            tmdbId: id,
          },
          orderBy: { lastWatchedAt: "desc" },
        }),
      ]);

      inWatchlist = !!wlItem;
      lastWatchedHistory = historyItem;
    } catch (e) {
      console.warn("Erro ao buscar histórico/watchlist para detalhes:", e);
    }
  }

  const isMovie = mediaType === "FILME";
  const startSeason = lastWatchedHistory?.seasonNumber || 1;
  const startEpisode = lastWatchedHistory?.episodeNumber || 1;

  const playHref = isMovie
    ? `/assistir/${type}/${id}`
    : `/assistir/${type}/${id}?s=${startSeason}&e=${startEpisode}`;

  // Se for série, busca primeira temporada de episódios
  let initialEpisodes: EpisodeDetails[] = [];
  if (!isMovie) {
    try {
      const seasonDetails = await metadataProvider.getSeasonDetails(id, startSeason);
      initialEpisodes = seasonDetails.episodes;
    } catch (e) {
      console.warn("Erro ao obter episódios iniciais:", e);
    }
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Backdrop Gigante */}
      <div className="relative w-full h-[50vh] sm:h-[65vh] min-h-[380px] overflow-hidden">
        {media.backdropUrl ? (
          <Image
            src={media.backdropUrl}
            alt={media.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.7]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-surface-light via-surface to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Conteúdo Principal com sobreposição */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 -mt-36 sm:-mt-52 z-20">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-10 items-start">
          {/* Poster */}
          <div className="flex-shrink-0 w-44 sm:w-60 md:w-72 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface-card mx-auto md:mx-0">
            <div className="relative aspect-[2/3] w-full">
              {media.posterUrl ? (
                <Image
                  src={media.posterUrl}
                  alt={media.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 176px, (max-width: 768px) 240px, 288px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-surface-light text-gray-500">
                  {isMovie ? <Film className="w-12 h-12 mb-2" /> : <Tv className="w-12 h-12 mb-2" />}
                  <span className="text-xs text-center">{media.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="flex-1 pt-2 sm:pt-4">
            {/* Metadados rápidos */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider shadow",
                  normalizedType === "DESENHO" || normalizedType === "DESENHOS" || (mediaType === "ANIME" && !isJapaneseAnime(media))
                    ? "bg-amber-600 text-amber-100"
                    : mediaType === "ANIME"
                    ? "bg-purple-600 text-purple-100"
                    : "bg-primary text-white"
                )}
              >
                {normalizedType === "DESENHO" || normalizedType === "DESENHOS" || (mediaType === "ANIME" && !isJapaneseAnime(media))
                  ? "Desenho"
                  : mediaType === "ANIME"
                  ? "Anime"
                  : mediaType}
              </span>

              {media.voteAverage > 0 && (
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{media.voteAverage}</span>
                  <span className="text-[10px] text-gray-400">({media.voteCount})</span>
                </div>
              )}

              {media.releaseYear && (
                <div className="flex items-center gap-1 text-xs text-gray-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{media.releaseYear}</span>
                </div>
              )}

              {media.runtime > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatMinutes(media.runtime)}</span>
                </div>
              )}

              {lastWatchedHistory?.isCompleted && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Assistido</span>
                </div>
              )}
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
              {media.title}
            </h1>

            {media.originalTitle && media.originalTitle !== media.title && (
              <p className="text-sm text-gray-400 italic mb-4">
                Título Original: {media.originalTitle}
              </p>
            )}

            {/* Tags de Gêneros */}
            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {media.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300 font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Sinopse */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8 max-w-3xl">
              {media.overview || "Nenhuma sinopse disponível para este título."}
            </p>

            {/* Ações principais */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8">
              <Link
                href={playHref}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-sm sm:text-base transition-all shadow-xl shadow-primary/30 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>
                  {lastWatchedHistory && !isMovie
                    ? `Continuar (T${startSeason}:E${startEpisode})`
                    : "Assistir Agora"}
                </span>
              </Link>

              <WatchlistButton
                tmdbId={id}
                mediaType={mediaType}
                title={media.title}
                posterUrl={media.posterUrl}
                initialInWatchlist={inWatchlist}
              />
            </div>

            {/* Elenco Principal */}
            {media.cast.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Elenco Principal
                </h3>
                <div className="flex items-center gap-3 overflow-x-auto plix-scrollbar pb-2">
                  {media.cast.map((actor) => (
                    <div
                      key={actor.id}
                      className="flex-shrink-0 w-24 text-center group"
                    >
                      <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden bg-surface-light border border-white/10 mb-1.5">
                        {actor.profileUrl ? (
                          <Image
                            src={actor.profileUrl}
                            alt={actor.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-200 truncate">
                        {actor.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {actor.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seletor de Temporadas e Episódios (Para Séries, Animes e Doramas) */}
        {!isMovie && media.seasons && media.seasons.length > 0 && (
          <SeasonEpisodeSelector
            tmdbId={id}
            routeType={type}
            seasons={media.seasons}
            initialEpisodes={initialEpisodes}
          />
        )}
      </div>
    </div>
  );
}
