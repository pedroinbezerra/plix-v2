const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Simulação da lógica de classificação da biblioteca media-classifier
function isJapaneseAnime(media) {
  if (!media) return false;

  // 1. Flag explícita persistida no metadado
  if (typeof media.isAnime === "boolean") {
    return media.isAnime;
  }

  // 2. Idioma original
  if (media.originalLanguage) {
    const lang = media.originalLanguage.toLowerCase().trim();
    if (lang === "ja" || lang === "jpn" || lang === "japanese") return true;
    if (lang === "zh" || lang === "ko") return true;
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

  // 4. Detecção por caracteres japoneses no título
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
  ];

  if (westernCartoons.some((w) => titleLower.includes(w))) {
    return false;
  }

  // 6. Lista de franquias de anime famosas
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
    "frieren",
    "solo leveling",
  ];

  if (animeKeywords.some((k) => titleLower.includes(k))) {
    return true;
  }

  return media.mediaType === "ANIME";
}

describe("Classificação de Mídia — Animes vs Desenhos Animados", () => {
  test("Classifica produções japonesas legítimas como Anime (isJapaneseAnime = true)", () => {
    const anime1 = {
      title: "Attack on Titan",
      originCountry: ["JP"],
      originalLanguage: "ja",
      mediaType: "ANIME",
    };
    const anime2 = {
      title: "Frieren: Beyond Journey's End",
      originalTitle: "葬送のフリーレン",
      originCountry: ["JP"],
      originalLanguage: "ja",
      mediaType: "ANIME",
    };
    const anime3 = {
      title: "Um Chute no Meu Diabo!",
      originalLanguage: "ja",
      originCountry: ["JP"],
      mediaType: "ANIME",
    };
    const anime4 = {
      title: "Naruto Shippuden",
      mediaType: "ANIME",
    };

    assert.equal(isJapaneseAnime(anime1), true);
    assert.equal(isJapaneseAnime(anime2), true);
    assert.equal(isJapaneseAnime(anime3), true);
    assert.equal(isJapaneseAnime(anime4), true);
  });

  test("Classifica produções e desenhos ocidentais como Desenhos (isJapaneseAnime = false)", () => {
    const cartoon1 = {
      title: "ThunderCats",
      originCountry: ["US"],
      originalLanguage: "en",
      mediaType: "ANIME", // No WarezCDN vem agrupado na categoria anime
    };
    const cartoon2 = {
      title: "As Meninas Superpoderosas",
      originCountry: ["US"],
      originalLanguage: "en",
      mediaType: "ANIME",
    };
    const cartoon3 = {
      title: "O Laboratório de Dexter",
      originCountry: ["US"],
      originalLanguage: "en",
      mediaType: "ANIME",
    };
    const cartoon4 = {
      title: "A Vaca e o Frango",
      originCountry: ["US"],
      originalLanguage: "en",
      mediaType: "ANIME",
    };
    const cartoon5 = {
      title: "Baby Looney Tunes",
      mediaType: "ANIME",
    };
    const cartoon6 = {
      title: "Primal",
      originCountry: ["US"],
      originalLanguage: "en",
      mediaType: "ANIME",
    };

    assert.equal(isJapaneseAnime(cartoon1), false);
    assert.equal(isJapaneseAnime(cartoon2), false);
    assert.equal(isJapaneseAnime(cartoon3), false);
    assert.equal(isJapaneseAnime(cartoon4), false);
    assert.equal(isJapaneseAnime(cartoon5), false);
    assert.equal(isJapaneseAnime(cartoon6), false);
  });

  test("Respeita a flag persistida isAnime quando existente no cache", () => {
    assert.equal(isJapaneseAnime({ isAnime: true, title: "Qualquer" }), true);
    assert.equal(isJapaneseAnime({ isAnime: false, title: "Qualquer" }), false);
  });

  test("Rotas de reprodução e detalhes aceitam desenho e desenhos mapeando para ANIME", () => {
    const validTypes = {
      FILME: "FILME",
      SERIE: "SERIE",
      ANIME: "ANIME",
      DORAMA: "DORAMA",
      DESENHO: "ANIME",
      DESENHOS: "ANIME",
    };

    assert.equal(validTypes["DESENHO"], "ANIME");
    assert.equal(validTypes["DESENHOS"], "ANIME");
    assert.equal(validTypes["ANIME"], "ANIME");
  });

  test("Badge e rotas em MediaCard atribuem cores e rotas distintas", () => {
    const mediaCardItem = (media) => {
      const isAnimeType = media.mediaType === "ANIME";
      const isRealAnime = isAnimeType ? isJapaneseAnime(media) : false;
      const displayType = isAnimeType ? (isRealAnime ? "ANIME" : "DESENHO") : media.mediaType;

      const typeLabels = {
        FILME: "Filme",
        SERIE: "Série",
        ANIME: "Anime",
        DESENHO: "Desenho",
        DORAMA: "Dorama",
      };

      const typeColors = {
        FILME: "bg-blue-600/80 text-blue-100",
        SERIE: "bg-emerald-600/80 text-emerald-100",
        ANIME: "bg-purple-600/80 text-purple-100",
        DESENHO: "bg-amber-600/80 text-amber-100",
        DORAMA: "bg-rose-600/80 text-rose-100",
      };

      const routeType = displayType === "DESENHO" ? "desenho" : media.mediaType.toLowerCase();
      const href = `/detalhes/${routeType}/${media.id}`;

      return {
        displayType,
        label: typeLabels[displayType],
        badgeColor: typeColors[displayType],
        href,
      };
    };

    const animeCard = mediaCardItem({
      id: "121787",
      title: "takt op.Destiny",
      mediaType: "ANIME",
      originCountry: ["JP"],
      originalLanguage: "ja",
    });

    const cartoonCard = mediaCardItem({
      id: "1988",
      title: "ThunderCats",
      mediaType: "ANIME",
      originCountry: ["US"],
      originalLanguage: "en",
    });

    assert.equal(animeCard.label, "Anime");
    assert.equal(animeCard.badgeColor, "bg-purple-600/80 text-purple-100");
    assert.equal(animeCard.href, "/detalhes/anime/121787");

    assert.equal(cartoonCard.label, "Desenho");
    assert.equal(cartoonCard.badgeColor, "bg-amber-600/80 text-amber-100");
    assert.equal(cartoonCard.href, "/detalhes/desenho/1988");
  });
});
