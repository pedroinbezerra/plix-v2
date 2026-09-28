import { MediaType } from "@prisma/client";

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface EpisodeDetails {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillUrl: string | null;
  runtime: number;
  voteAverage: number;
  airDate?: string | null;
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterUrl: string | null;
  airDate?: string | null;
}

export interface SeasonDetails {
  seasonNumber: number;
  name: string;
  overview: string;
  posterUrl: string | null;
  episodes: EpisodeDetails[];
}

export interface EnrichedMedia {
  id: string; // TMDB ID
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  releaseYear: string;
  genres: string[];
  runtime: number; // minutos
  voteAverage: number;
  voteCount: number;
  cast: CastMember[];
  seasonsCount?: number;
  episodesCount?: number;
  seasons?: SeasonSummary[];
  originCountry?: string[];
  originalLanguage?: string;
  isAnime?: boolean;
}
