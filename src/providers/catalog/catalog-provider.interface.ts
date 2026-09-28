import { CatalogCategory, GenreItem } from "./types";

export interface ICatalogProvider {
  /**
   * Retorna lista de IDs TMDB para a categoria especificada.
   * Suporta paginação / fatiamento para performance.
   */
  getCategoryItemIds(category: CatalogCategory): Promise<string[]>;

  /**
   * Retorna os gêneros disponíveis para a categoria.
   */
  getGenres(category: CatalogCategory): Promise<GenreItem[]>;

  /**
   * Retorna os IDs TMDB para uma categoria e slug de gênero.
   */
  getItemIdsByGenre(category: CatalogCategory, genreSlug: string): Promise<string[]>;

  /**
   * Verifica se determinado ID pertence à categoria informada.
   */
  hasItem(category: CatalogCategory, tmdbId: string): Promise<boolean>;
}
