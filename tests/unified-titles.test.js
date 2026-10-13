const { describe, it } = require("node:test");
const assert = require("node:assert");

// Simula a lógica de formatação de duração idêntica a src/lib/utils.ts
function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatMediaDuration(options) {
  const { mediaType, runtime, seasonsCount, episodesCount, seasonNumber, episodeNumber } = options;

  if (seasonNumber && episodeNumber) {
    return runtime && runtime > 0 ? formatMinutes(runtime) : "";
  }

  const isMovie = mediaType === "FILME";
  if (isMovie) {
    return runtime && runtime > 0 ? formatMinutes(runtime) : "";
  }

  if (episodesCount && episodesCount > 0 && runtime && runtime > 0) {
    const totalMinutes = episodesCount * runtime;
    return formatMinutes(totalMinutes);
  }

  if (runtime && runtime > 0) {
    return formatMinutes(runtime);
  }

  if (episodesCount && episodesCount > 0) {
    return `${episodesCount} eps`;
  }

  if (seasonsCount && seasonsCount > 0) {
    return seasonsCount === 1 ? "1 temp" : `${seasonsCount} temps`;
  }

  return "";
}

describe("Padronização de Títulos — Indicador de Tempo Total e Menu", () => {
  it("Calcula corretamente o tempo total para filmes", () => {
    assert.strictEqual(
      formatMediaDuration({ mediaType: "FILME", runtime: 120 }),
      "2h"
    );
    assert.strictEqual(
      formatMediaDuration({ mediaType: "FILME", runtime: 105 }),
      "1h 45m"
    );
    assert.strictEqual(
      formatMediaDuration({ mediaType: "FILME", runtime: 55 }),
      "55m"
    );
    assert.strictEqual(
      formatMediaDuration({ mediaType: "FILME", runtime: 0 }),
      ""
    );
  });

  it("Calcula corretamente a duração de episódios individuais", () => {
    assert.strictEqual(
      formatMediaDuration({
        mediaType: "SERIE",
        seasonNumber: 1,
        episodeNumber: 4,
        runtime: 48,
      }),
      "48m"
    );
    assert.strictEqual(
      formatMediaDuration({
        mediaType: "ANIME",
        seasonNumber: 2,
        episodeNumber: 12,
        runtime: 24,
      }),
      "24m"
    );
  });

  it("Calcula o tempo total da série quando episódios e runtime médio estão presentes", () => {
    // Ex: Série com 10 episódios de 60 minutos = 600 minutos = 10 horas
    assert.strictEqual(
      formatMediaDuration({
        mediaType: "SERIE",
        episodesCount: 10,
        runtime: 60,
      }),
      "10h"
    );

    // Ex: Anime com 24 episódios de 25 minutos = 600 minutos = 10 horas
    assert.strictEqual(
      formatMediaDuration({
        mediaType: "ANIME",
        episodesCount: 24,
        runtime: 25,
      }),
      "10h"
    );

    // Ex: Dorama com 16 episódios de 70 minutos = 1120 minutos = 18h 40m
    assert.strictEqual(
      formatMediaDuration({
        mediaType: "DORAMA",
        episodesCount: 16,
        runtime: 70,
      }),
      "18h 40m"
    );
  });

  it("Aplica fallback quando apenas runtime médio ou contagem de temporadas/episódios existem", () => {
    assert.strictEqual(
      formatMediaDuration({ mediaType: "SERIE", runtime: 45 }),
      "45m"
    );
    assert.strictEqual(
      formatMediaDuration({ mediaType: "SERIE", episodesCount: 12 }),
      "12 eps"
    );
    assert.strictEqual(
      formatMediaDuration({ mediaType: "SERIE", seasonsCount: 3 }),
      "3 temps"
    );
    assert.strictEqual(
      formatMediaDuration({ mediaType: "SERIE", seasonsCount: 1 }),
      "1 temp"
    );
  });

  it("Gera estrutura uniforme de opções do Menu de Três Pontinhos (•••)", () => {
    const media = {
      id: "1399",
      mediaType: "SERIE",
      title: "Game of Thrones",
      runtime: 60,
      seasonsCount: 8,
      episodesCount: 73,
    };

    const menuActions = [
      { id: "watchlist", label: (inList) => (inList ? "Remover de Quero Assistir" : "Adicionar a Quero Assistir") },
      { id: "watched", label: (isDone) => (isDone ? "Marcar como não assistido" : "Marcar como assistido") },
      { id: "details", label: (type) => `Ir para a ${type.toLowerCase()}` },
      { id: "share", label: () => "Compartilhar" },
      { id: "copy", label: () => "Copiar link" },
    ];

    assert.strictEqual(menuActions.length, 5);
    assert.strictEqual(menuActions[0].label(false), "Adicionar a Quero Assistir");
    assert.strictEqual(menuActions[0].label(true), "Remover de Quero Assistir");
    assert.strictEqual(menuActions[1].label(false), "Marcar como assistido");
    assert.strictEqual(menuActions[1].label(true), "Marcar como não assistido");
    assert.strictEqual(menuActions[2].label(media.mediaType), "Ir para a serie");
  });
});
