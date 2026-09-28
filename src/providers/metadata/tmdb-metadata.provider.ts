import { MediaType } from "@prisma/client";
import { IMetadataProvider } from "./metadata-provider.interface";
import { EnrichedMedia, SeasonDetails, EpisodeDetails, SeasonSummary, CastMember } from "./types";
import { prisma } from "@/lib/db/prisma";
import { isJapaneseAnime } from "@/lib/media-classifier";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const CACHE_TTL_DAYS = 7;

export class TmdbMetadataProvider implements IMetadataProvider {
  private get token(): string | undefined {
    return process.env.TMDB_ACCESS_TOKEN?.trim();
  }

  private get language(): string {
    return process.env.TMDB_LANGUAGE || "pt-BR";
  }

  private get region(): string {
    return process.env.TMDB_REGION || "BR";
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private formatImageUrl(path: string | null | undefined, size: "w342" | "w500" | "w780" | "w1280" | "original" = "w500"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  private createFallbackMedia(tmdbId: string, mediaType: MediaType, customTitle?: string): EnrichedMedia {
    const isMovie = mediaType === "FILME";
    return {
      id: tmdbId,
      mediaType,
      title: customTitle || (isMovie ? `Filme #${tmdbId}` : `Série #${tmdbId}`),
      originalTitle: customTitle || "",
      overview: "Detalhes e sinopse em carregamento ou indisponíveis.",
      posterUrl: null,
      backdropUrl: null,
      releaseDate: null,
      releaseYear: "",
      genres: [],
      runtime: isMovie ? 120 : 45,
      voteAverage: 0,
      voteCount: 0,
      cast: [],
      seasonsCount: isMovie ? undefined : 1,
      episodesCount: isMovie ? undefined : 1,
    };
  }

  async getDetails(tmdbId: string, mediaType: MediaType): Promise<EnrichedMedia> {
    const cleanId = String(tmdbId).trim();
    if (!cleanId) return this.createFallbackMedia(cleanId, mediaType);

    // 1. Tenta obter do cache persistente no PostgreSQL
    try {
      const cached = await prisma.mediaMetadataCache.findUnique({
        where: {
          tmdbId_mediaType: {
            tmdbId: cleanId,
            mediaType,
          },
        },
      });

      if (cached && new Date(cached.expiresAt) > new Date()) {
        const enriched = cached.data as unknown as EnrichedMedia;
        if (enriched.isAnime === undefined) {
          enriched.isAnime = isJapaneseAnime(enriched);
        }
        return enriched;
      }
    } catch (e) {
      console.warn("Aviso ao ler cache do TMDB no banco:", e);
    }

    // 2. Se não tem token do TMDB configurado, retorna fallback gracioso
    if (!this.token) {
      return this.createFallbackMedia(cleanId, mediaType);
    }

    // 3. Consulta à API do TMDB
    const endpoint = mediaType === "FILME" ? "movie" : "tv";
    const url = `${TMDB_API_BASE}/${endpoint}/${cleanId}?language=${this.language}&append_to_response=credits`;

    try {
      const res = await fetch(url, {
        headers: this.getHeaders(),
        next: { revalidate: 86400 }, // 24h
      });

      if (!res.ok) {
        console.warn(`TMDB retornou status ${res.status} para ${endpoint}/${cleanId}`);
        return this.createFallbackMedia(cleanId, mediaType);
      }

      const data = await res.json();

      // Transformação dos dados TMDB
      const isMovie = mediaType === "FILME";
      const title = isMovie ? data.title || data.original_title : data.name || data.original_name;
      const originalTitle = isMovie ? data.original_title : data.original_name;
      const releaseDate = isMovie ? data.release_date : data.first_air_date;
      const releaseYear = releaseDate ? releaseDate.split("-")[0] : "";
      const runtime = isMovie
        ? data.runtime || 0
        : data.episode_run_time?.[0] || 45;

      const genres = Array.isArray(data.genres) ? data.genres.map((g: { name: string }) => g.name) : [];

      const cast: CastMember[] = Array.isArray(data.credits?.cast)
        ? data.credits.cast.slice(0, 10).map((c: { id: number; name: string; character: string; profile_path: string | null }) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profileUrl: this.formatImageUrl(c.profile_path, "w342"),
          }))
        : [];

      const seasons: SeasonSummary[] = !isMovie && Array.isArray(data.seasons)
        ? data.seasons
            .filter((s: { season_number: number }) => s.season_number > 0)
            .map((s: { season_number: number; name: string; episode_count: number; poster_path: string | null; air_date: string | null }) => ({
              seasonNumber: s.season_number,
              name: s.name || `Temporada ${s.season_number}`,
              episodeCount: s.episode_count,
              posterUrl: this.formatImageUrl(s.poster_path, "w342"),
              airDate: s.air_date,
            }))
        : [];

      const originCountry = Array.isArray(data.origin_country)
        ? data.origin_country
        : Array.isArray(data.production_countries)
        ? data.production_countries.map((p: { iso_3166_1: string }) => p.iso_3166_1)
        : [];
      const originalLanguage = data.original_language || "";
      const isAnimeOrigin = isJapaneseAnime({
        originCountry,
        originalLanguage,
        originalTitle: originalTitle || "",
        title: title || "",
      });

      const enriched: EnrichedMedia = {
        id: cleanId,
        mediaType,
        title: title || `Título #${cleanId}`,
        originalTitle: originalTitle || "",
        overview: data.overview || "Sem sinopse disponível em português.",
        posterUrl: this.formatImageUrl(data.poster_path, "w500"),
        backdropUrl: this.formatImageUrl(data.backdrop_path, "w1280"),
        releaseDate: releaseDate || null,
        releaseYear,
        genres,
        runtime,
        voteAverage: Number((data.vote_average || 0).toFixed(1)),
        voteCount: data.vote_count || 0,
        cast,
        seasonsCount: !isMovie ? data.number_of_seasons || seasons.length || 1 : undefined,
        episodesCount: !isMovie ? data.number_of_episodes : undefined,
        seasons: !isMovie ? seasons : undefined,
        originCountry,
        originalLanguage,
        isAnime: isAnimeOrigin,
      };

      // 4. Salva no banco de dados (MediaMetadataCache)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

      prisma.mediaMetadataCache
        .upsert({
          where: {
            tmdbId_mediaType: {
              tmdbId: cleanId,
              mediaType,
            },
          },
          create: {
            tmdbId: cleanId,
            mediaType,
            data: enriched as any,
            expiresAt,
          },
          update: {
            data: enriched as any,
            expiresAt,
          },
        })
        .catch((e) => console.warn("Erro ao salvar cache de mídia no banco:", e));

      return enriched;
    } catch (error) {
      console.error(`Erro ao consultar TMDB para ${cleanId}:`, error);
      return this.createFallbackMedia(cleanId, mediaType);
    }
  }

  async getBatchDetails(tmdbIds: string[], mediaType: MediaType): Promise<EnrichedMedia[]> {
    if (!tmdbIds || tmdbIds.length === 0) return [];

    const results: EnrichedMedia[] = [];
    const chunkSize = 5; // Executa em lotes de 5 para respeitar limites de concorrência

    for (let i = 0; i < tmdbIds.length; i += chunkSize) {
      const chunk = tmdbIds.slice(i, i + chunkSize);
      const chunkPromises = chunk.map((id) => this.getDetails(id, mediaType));
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  async getSeasonDetails(tmdbId: string, seasonNumber: number): Promise<SeasonDetails> {
    const cleanId = String(tmdbId).trim();
    const defaultSeason: SeasonDetails = {
      seasonNumber,
      name: `Temporada ${seasonNumber}`,
      overview: "",
      posterUrl: null,
      episodes: [],
    };

    if (!this.token) {
      // Cria episódios sintéticos quando sem token TMDB
      defaultSeason.episodes = Array.from({ length: 12 }, (_, idx) => ({
        episodeNumber: idx + 1,
        seasonNumber,
        name: `Episódio ${idx + 1}`,
        overview: "",
        stillUrl: null,
        runtime: 45,
        voteAverage: 0,
      }));
      return defaultSeason;
    }

    try {
      const url = `${TMDB_API_BASE}/tv/${cleanId}/season/${seasonNumber}?language=${this.language}`;
      const res = await fetch(url, {
        headers: this.getHeaders(),
        next: { revalidate: 86400 },
      });

      if (!res.ok) {
        return defaultSeason;
      }

      const data = await res.json();
      const episodes: EpisodeDetails[] = Array.isArray(data.episodes)
        ? data.episodes.map((ep: { episode_number: number; name: string; overview: string; still_path: string | null; runtime: number; vote_average: number; air_date: string | null }) => ({
            episodeNumber: ep.episode_number,
            seasonNumber,
            name: ep.name || `Episódio ${ep.episode_number}`,
            overview: ep.overview || "",
            stillUrl: this.formatImageUrl(ep.still_path, "w500"),
            runtime: ep.runtime || 45,
            voteAverage: Number((ep.vote_average || 0).toFixed(1)),
            airDate: ep.air_date,
          }))
        : [];

      return {
        seasonNumber: data.season_number ?? seasonNumber,
        name: data.name || `Temporada ${seasonNumber}`,
        overview: data.overview || "",
        posterUrl: this.formatImageUrl(data.poster_path, "w342"),
        episodes,
      };
    } catch (error) {
      console.error(`Erro ao obter episódios da temporada ${seasonNumber} de ${cleanId}:`, error);
      return defaultSeason;
    }
  }

  async search(query: string): Promise<EnrichedMedia[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery || !this.token) return [];

    try {
      const url = `${TMDB_API_BASE}/search/multi?query=${encodeURIComponent(cleanQuery)}&language=${this.language}&include_adult=false`;
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data.results)) return [];

      const list: EnrichedMedia[] = [];

      for (const item of data.results) {
        if (item.media_type !== "movie" && item.media_type !== "tv") continue;

        const isMovie = item.media_type === "movie";
        const mediaType: MediaType = isMovie ? "FILME" : "SERIE";
        const title = isMovie ? item.title || item.original_title : item.name || item.original_name;
        const releaseDate = isMovie ? item.release_date : item.first_air_date;

        list.push({
          id: String(item.id),
          mediaType,
          title: title || `Item #${item.id}`,
          originalTitle: (isMovie ? item.original_title : item.original_name) || "",
          overview: item.overview || "",
          posterUrl: this.formatImageUrl(item.poster_path, "w500"),
          backdropUrl: this.formatImageUrl(item.backdrop_path, "w1280"),
          releaseDate: releaseDate || null,
          releaseYear: releaseDate ? releaseDate.split("-")[0] : "",
          genres: [],
          runtime: isMovie ? 120 : 45,
          voteAverage: Number((item.vote_average || 0).toFixed(1)),
          voteCount: item.vote_count || 0,
          cast: [],
        });
      }

      return list;
    } catch (error) {
      console.error(`Erro na busca TMDB por '${query}':`, error);
      return [];
    }
  }
}

// Singleton do MetadataProvider
export const metadataProvider: IMetadataProvider = new TmdbMetadataProvider();
