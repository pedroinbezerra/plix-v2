import { EnrichedMedia } from "@/providers/metadata/types";

/**
 * Classificador de Animes vs Desenhos / Animações Ocidentais.
 * Utiliza critérios rigorosos da indústria (país de origem, idioma original e escrita):
 * - Anime: Produções originárias do Japão (ou irmãs asiáticas) com idioma 'ja' / país 'JP' / título em kanji-kana.
 * - Desenho/Animação Ocidental: Produções dos EUA, Reino Unido, França, etc. (ex: ThunderCats, Meninas Superpoderosas).
 */
export function isJapaneseAnime(
  media: Partial<EnrichedMedia> | {
    isAnime?: boolean;
    originCountry?: string[];
    originalLanguage?: string;
    originalTitle?: string;
    title?: string;
    mediaType?: string;
  }
): boolean {
  if (!media) return false;

  // 1. Flag explícita persistida no metadado
  if (typeof media.isAnime === "boolean") {
    return media.isAnime;
  }

  // 2. Idioma original
  if (media.originalLanguage) {
    const lang = media.originalLanguage.toLowerCase().trim();
    if (lang === "ja" || lang === "jpn" || lang === "japanese") return true;
    if (lang === "zh" || lang === "ko") return true; // Donghua ou animação coreana
    if (["en", "pt", "es", "fr", "de", "it", "ru"].includes(lang)) return false;
  }

  // 3. País de origem
  if (Array.isArray(media.originCountry) && media.originCountry.length > 0) {
    const hasAsianOrigin = media.originCountry.some((c) =>
      ["JP", "CN", "KR", "TW", "HK"].includes(String(c).toUpperCase())
    );
    if (hasAsianOrigin) return true;
    return false;
  }

  // 4. Detecção por caracteres japoneses (Hiragana, Katakana, CJK Kanji) no título
  const allTitles = `${media.title || ""} ${media.originalTitle || ""}`;
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(allTitles)) {
    return true;
  }

  // 5. Lista de títulos clássicos de desenhos ocidentais conhecidos no catálogo
  const titleLower = allTitles.toLowerCase();
  const westernCartoons = [
    "thundercats",
    "meninas superpoderosas",
    "powerpuff",
    "looney tunes",
    "mansão foster",
    "foster's home",
    "vaca e o frango",
    "cow and chicken",
    "laboratório de dexter",
    "dexter's laboratory",
    "farzar",
    "primal",
    "jurassic world",
    "ben 10",
    "simpsons",
    "rick and morty",
    "avatar",
    "liga da justiça",
    "justice league",
    "batman",
    "scooby",
    "tom and jerry",
    "tom & jerry",
    "tartarugas ninja",
    "ninja turtles",
    "coragem o cão",
    "courage the cowardly",
    "du, dudu e edu",
    "ed, edd n eddy",
    "hora de aventura",
    "adventure time",
    "apenas um show",
    "regular show",
    "gumball",
    "steven universo",
    "steven universe",
    "gravity falls",
    "star wars",
    "south park",
    "family guy",
    "futurama",
    "archer",
    "arcane",
    "castlevania",
    "invencível",
    "invincible",
    "x-men",
    "homem-aranha",
    "spider-man",
    "puffy amiyumi",
  ];

  if (westernCartoons.some((w) => titleLower.includes(w))) {
    return false;
  }

  // 6. Lista de franquias de anime famosas (fallback sem TMDB)
  const animeKeywords = [
    "naruto",
    "boruto",
    "dragon ball",
    "one piece",
    "bleach",
    "attack on titan",
    "shingeki",
    "jujutsu kaisen",
    "demon slayer",
    "kimetsu",
    "death note",
    "hunter x hunter",
    "boku no hero",
    "my hero academia",
    "tokyo ghoul",
    "frieren",
    "solo leveling",
    "chainsaw man",
    "spy x family",
    "fullmetal alchemist",
    "sword art online",
    "haikyuu",
    "black clover",
    "fairy tail",
    "evangelion",
    "overlord",
    "konosuba",
    "re:zero",
    "danmachi",
    "takt op",
    "dr. stone",
    "vinland saga",
    "mob psycho",
    "one punch man",
    "nanatsu no taizai",
  ];

  if (animeKeywords.some((k) => titleLower.includes(k))) {
    return true;
  }

  return (media as any).mediaType === "ANIME";
}
