export type CatalogCategory = "filme" | "serie" | "anime" | "dorama" | "desenho";

export interface GenreItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  itemsCount: number;
}

export interface CatalogSearchResult {
  id: string;
  category: CatalogCategory;
}
