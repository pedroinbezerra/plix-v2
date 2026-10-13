import { ICatalogProvider } from "./catalog-provider.interface";
import { CatalogCategory, GenreItem } from "./types";
import { prisma } from "@/lib/db/prisma";

const BASE_URL = (process.env.POMFY_CATALOG_BASE_URL || "https://api.pomfy.stream").replace(/\/+$/, "");
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export class PomfyCatalogProvider implements ICatalogProvider {
  // Cache em memória para acesso ultrarrápido
  private memoryCache: Map<string, { data: string[]; timestamp: number }> = new Map();
  private setCache: Map<string, Set<string>> = new Map();

  async getCategoryItemIds(category: CatalogCategory): Promise<string[]> {
    const cacheKey = `pomfy_cat_${category}`;
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

      if (dbCached && now - new Date(dbCached.updatedAt).getTime() < CACHE_TTL_MS) {
        const ids = dbCached.itemIds as string[];
        this.memoryCache.set(cacheKey, { data: ids, timestamp: now });
        this.setCache.set(cacheKey, new Set(ids));
        return ids;
      }
    } catch (e) {
      console.warn("Aviso ao ler cache do banco para catálogo Pomfy:", e);
    }

    // Mapeamento de categorias Plix -> Pomfy:
    // "filme" -> "filmes"
    // "serie", "anime", "dorama", "desenho" -> "series"
    const pomfyTipo = category === "filme" ? "filmes" : "series";

    // 3. Chamada à API Pomfy
    try {
      const url = `${BASE_URL}/lista?tipo=${pomfyTipo}&formato=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Plix/1.0" },
        next: { revalidate: 43200 }, // 12h
      });

      if (!res.ok) {
        throw new Error(`Pomfy Catalog API responded with status ${res.status}`);
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
        .catch((e) => console.warn("Erro ao salvar cache de catálogo Pomfy no banco:", e));

      return ids;
    } catch (error) {
      console.error(`Erro ao carregar catálogo Pomfy para ${category}:`, error);

      // Fallback: se falhar, retorna o que tiver em cache mesmo expirado
      if (inMem) return inMem.data;
      return [];
    }
  }

  async getGenres(category: CatalogCategory): Promise<GenreItem[]> {
    // A API do Pomfy não possui endpoint dedicado a gêneros na documentação atual.
    // Retorna lista padrão de gêneros TMDB populares para navegação.
    const defaultMovieGenres: GenreItem[] = [
      { id: 28, name: "Ação", slug: "acao", category: "filme", itemsCount: 0 },
      { id: 12, name: "Aventura", slug: "aventura", category: "filme", itemsCount: 0 },
      { id: 16, name: "Animação", slug: "animacao", category: "filme", itemsCount: 0 },
      { id: 35, name: "Comédia", slug: "comedia", category: "filme", itemsCount: 0 },
      { id: 80, name: "Crime", slug: "crime", category: "filme", itemsCount: 0 },
      { id: 18, name: "Drama", slug: "drama", category: "filme", itemsCount: 0 },
      { id: 14, name: "Fantasia", slug: "fantasia", category: "filme", itemsCount: 0 },
      { id: 27, name: "Terror", slug: "terror", category: "filme", itemsCount: 0 },
      { id: 878, name: "Ficção Científica", slug: "ficcao-cientifica", category: "filme", itemsCount: 0 },
      { id: 53, name: "Suspense", slug: "suspense", category: "filme", itemsCount: 0 },
    ];

    const defaultTvGenres: GenreItem[] = [
      { id: 10759, name: "Ação & Aventura", slug: "acao-aventura", category: "serie", itemsCount: 0 },
      { id: 16, name: "Animação", slug: "animacao", category: "serie", itemsCount: 0 },
      { id: 35, name: "Comédia", slug: "comedia", category: "serie", itemsCount: 0 },
      { id: 80, name: "Crime", slug: "crime", category: "serie", itemsCount: 0 },
      { id: 18, name: "Drama", slug: "drama", category: "serie", itemsCount: 0 },
      { id: 10765, name: "Sci-Fi & Fantasia", slug: "sci-fi-fantasia", category: "serie", itemsCount: 0 },
      { id: 9648, name: "Mistério", slug: "misterio", category: "serie", itemsCount: 0 },
    ];

    return category === "filme" ? defaultMovieGenres : defaultTvGenres;
  }

  async getItemIdsByGenre(category: CatalogCategory, genreSlug: string): Promise<string[]> {
    // Retorna todos os itens da categoria como base para filtragem
    return this.getCategoryItemIds(category);
  }

  async hasItem(category: CatalogCategory, tmdbId: string): Promise<boolean> {
    const cacheKey = `pomfy_cat_${category}`;
    let set = this.setCache.get(cacheKey);

    if (!set) {
      const ids = await this.getCategoryItemIds(category);
      set = new Set(ids);
      this.setCache.set(cacheKey, set);
    }

    return set.has(String(tmdbId).trim());
  }
}

// Singleton do PomfyCatalogProvider
export const pomfyCatalogProvider: ICatalogProvider = new PomfyCatalogProvider();
