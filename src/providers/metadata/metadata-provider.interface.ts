import { MediaType } from "@prisma/client";
import { EnrichedMedia, SeasonDetails } from "./types";

export interface IMetadataProvider {
  /**
   * Obtém detalhes enriquecidos de um título (filme ou série/anime/dorama).
   */
  getDetails(tmdbId: string, mediaType: MediaType): Promise<EnrichedMedia>;

  /**
   * Obtém múltiplos títulos em lote com concorrência controlada e cache persistente.
   */
  getBatchDetails(tmdbIds: string[], mediaType: MediaType): Promise<EnrichedMedia[]>;

  /**
   * Obtém lista de episódios e detalhes de uma temporada específica.
   */
  getSeasonDetails(tmdbId: string, seasonNumber: number): Promise<SeasonDetails>;

  /**
   * Pesquisa global por termo (enriquecida pelo TMDB).
   */
  search(query: string): Promise<EnrichedMedia[]>;
}
