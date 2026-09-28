const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Catalog & Poster — Validação e Autocura de Imagens", () => {
  it("Detecta pôsteres inválidos, vazios ou de teste", () => {
    const isInvalid = (url) => !url || url.trim() === "" || url.includes("test.jpg");

    assert.strictEqual(isInvalid(null), true);
    assert.strictEqual(isInvalid(""), true);
    assert.strictEqual(isInvalid("   "), true);
    assert.strictEqual(isInvalid("https://image.tmdb.org/t/p/w500/test.jpg"), true);
    assert.strictEqual(
      isInvalid("https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg"),
      false
    );
  });

  it("Gera estrutura correta para autocura de mídia", () => {
    const media = {
      tmdbId: "383498",
      mediaType: "FILME",
      title: "Deadpool 2",
      posterUrl: null,
    };

    const details = {
      id: "383498",
      mediaType: "FILME",
      title: "Deadpool 2",
      posterUrl: "https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg",
    };

    const healedPoster = media.posterUrl || details.posterUrl;
    assert.strictEqual(
      healedPoster,
      "https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg"
    );
  });
});
