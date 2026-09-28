import { ICatalogProvider } from "./catalog-provider.interface";
import { CatalogCategory, GenreItem } from "./types";
import { prisma } from "@/lib/db/prisma";

const BASE_URL = process.env.CATALOG_PROVIDER_BASE_URL || "https://warezcdn.sbs";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export class WarezCdnCatalogProvider implements ICatalogProvider {
  // Cache em memória para acesso ultrarrápido
  private memoryCache: Map<string, { data: string[]; timestamp: number }> = new Map();
  private setCache: Map<string, Set<string>> = new Map();

  async getCategoryItemIds(category: CatalogCategory): Promise<string[]> {
    const cacheKey = `cat_${category}`;
    const now = Date.now();

    // 1. Tenta cache em memória
    const inMem = this.memoryCache.get(cacheKey);
    if (inMem && now - inMem.timestamp < CACHE_TTL_MS) {
      return inMem.data;
    }

    // 2. Tenta cache no PostgreSQL
    try {
      const dbCached = await prisma.catalogCache.findUnique({
        where: { category: cacheKey },
      });

      if (dbCached && (category === "desenho" || now - new Date(dbCached.updatedAt).getTime() < CACHE_TTL_MS)) {
        const ids = dbCached.itemIds as string[];
        this.memoryCache.set(cacheKey, { data: ids, timestamp: now });
        this.setCache.set(cacheKey, new Set(ids));
        return ids;
      }
    } catch (e) {
      console.warn("Aviso ao ler cache do banco para catálogo:", e);
    }

    // Se categoria for "desenho", retorna o cache do banco ou fallback (não consulta API do WarezCDN pois não há endpoint nativo de desenho)
    if (category === "desenho") {
      try {
        const dbCached = await prisma.catalogCache.findUnique({
          where: { category: "cat_desenho" },
        });
        if (dbCached && Array.isArray(dbCached.itemIds)) {
          const ids = dbCached.itemIds as string[];
          this.memoryCache.set(cacheKey, { data: ids, timestamp: now });
          this.setCache.set(cacheKey, new Set(ids));
          return ids;
        }
      } catch (e) {}
      if (inMem) return inMem.data;
      return [];
    }

    // 3. Chamada à API externa
    try {
      const url = `${BASE_URL}/lista?category=${category}&type=tmdb&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Plix/1.0" },
        next: { revalidate: 43200 }, // 12h
      });

      if (!res.ok) {
        throw new Error(`Catalog API responded with status ${res.status}`);
      }

      const raw = await res.json();
      const ids: string[] = Array.isArray(raw)
        ? raw.map((id) => String(id).trim()).filter(Boolean)
        : [];

      // Atualiza memória
      this.memoryCache.set(cacheKey, { data: ids, timestamp: now });
      this.setCache.set(cacheKey, new Set(ids));

      // Atualiza banco em background
      prisma.catalogCache
        .upsert({
          where: { category: cacheKey },
          create: { category: cacheKey, itemIds: ids },
          update: { itemIds: ids },
        })
        .catch((e) => console.warn("Erro ao salvar cache de catálogo no banco:", e));

      return ids;
    } catch (error) {
      console.error(`Erro ao carregar catálogo para ${category}:`, error);

      // Fallback: se falhar, retorna o que tiver em cache mesmo expirado
      if (inMem) return inMem.data;
      return [];
    }
  }

  async getGenres(category: CatalogCategory): Promise<GenreItem[]> {
    const targetCategory = category === "desenho" ? "anime" : category;
    try {
      const url = `${BASE_URL}/lista?category=${targetCategory}&type=generos&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Plix/1.0" },
        next: { revalidate: 86400 }, // 24h
      });

      if (!res.ok) return [];

      const raw = await res.json();
      if (raw && raw.success && Array.isArray(raw.data)) {
        return raw.data.map((item: { id: number; name: string; slug: string; category: string; items_count?: number }) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          category: item.category,
          itemsCount: item.items_count || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error(`Erro ao obter gêneros para ${category}:`, error);
      return [];
    }
  }

  async getItemIdsByGenre(category: CatalogCategory, genreSlug: string): Promise<string[]> {
    if (category === "desenho") {
      const [animeGenreIds, cartoonIds] = await Promise.all([
        this.getItemIdsByGenre("anime", genreSlug),
        this.getCategoryItemIds("desenho"),
      ]);
      const cartoonSet = new Set(cartoonIds);
      return animeGenreIds.filter((id) => cartoonSet.has(id));
    }
    const cacheKey = `genre_${category}_${genreSlug}`;
    const now = Date.now();

    const inMem = this.memoryCache.get(cacheKey);
    if (inMem && now - inMem.timestamp < CACHE_TTL_MS) {
      return inMem.data;
    }

    try {
      const url = `${BASE_URL}/lista?category=${category}&type=tmdb&genero=${genreSlug}&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Plix/1.0" },
        next: { revalidate: 43200 },
      });

      if (!res.ok) return [];

      const raw = await res.json();
      const ids: string[] = Array.isArray(raw)
        ? raw.map((id) => String(id).trim()).filter(Boolean)
        : [];

      this.memoryCache.set(cacheKey, { data: ids, timestamp: now });
      return ids;
    } catch (error) {
      console.error(`Erro ao obter títulos do gênero ${genreSlug}:`, error);
      return [];
    }
  }

  async hasItem(category: CatalogCategory, tmdbId: string): Promise<boolean> {
    const cacheKey = `cat_${category}`;
    let set = this.setCache.get(cacheKey);

    if (!set) {
      const ids = await this.getCategoryItemIds(category);
      set = new Set(ids);
      this.setCache.set(cacheKey, set);
    }

    return set.has(String(tmdbId).trim());
  }
}

// Singleton do CatalogProvider
export const catalogProvider: ICatalogProvider = new WarezCdnCatalogProvider();
