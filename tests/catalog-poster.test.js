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

  it("Gera estrutura correta para autocura de mídia com poster, ano de lançamento e avaliação", () => {
    const media = {
      tmdbId: "383498",
      mediaType: "FILME",
      title: "Deadpool 2",
      posterUrl: null,
      releaseYear: "",
      voteAverage: 0,
    };

    const details = {
      id: "383498",
      mediaType: "FILME",
      title: "Deadpool 2",
      posterUrl: "https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg",
      releaseYear: "2018",
      voteAverage: 7.5,
    };

    const isMissingYear = (year) => !year || year.trim() === "" || year === "—";
    const isInvalidPoster = (url) => !url || url.trim() === "" || url.includes("test.jpg");

    assert.strictEqual(isMissingYear(media.releaseYear), true);
    assert.strictEqual(isInvalidPoster(media.posterUrl), true);

    const healedPoster = media.posterUrl || details.posterUrl;
    const healedYear = isMissingYear(media.releaseYear) ? details.releaseYear : media.releaseYear;
    const healedVote = media.voteAverage || details.voteAverage;

    assert.strictEqual(
      healedPoster,
      "https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg"
    );
    assert.strictEqual(healedYear, "2018");
    assert.strictEqual(healedVote, 7.5);
  });
});
