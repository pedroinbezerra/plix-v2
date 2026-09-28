const { describe, it } = require("node:test");
const assert = require("node:assert");

// Importação direta da classe compilada ou simulada em JS puro para execução rápida
class WarezCdnPlaybackProvider {
  constructor(baseUrl = "https://warezcdn.sbs") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.defaultAllow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *";
  }

  sanitizeId(id) {
    const clean = String(id).trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      throw new Error(`ID de mídia inválido: ${id}`);
    }
    return clean;
  }

  buildFragment(options = {}) {
    const fragments = [];
    if (options.noEpList !== false) fragments.push("noEpList");
    if (options.noLink) fragments.push("noLink");
    if (options.transparent) fragments.push("transparent");
    if (options.color) {
      const cleanColor = options.color.replace(/^#/, "");
      if (/^[0-9a-fA-F]{3,6}$/.test(cleanColor)) {
        fragments.push(`color=${cleanColor}`);
      }
    }
    return fragments.length > 0 ? `#${fragments.join("&")}` : "";
  }

  getMoviePlayerConfig(tmdbId, options = {}) {
    const cleanId = this.sanitizeId(tmdbId);
    const fragment = this.buildFragment(options);
    return {
      streamUrl: `${this.baseUrl}/filme/${cleanId}${fragment}`,
      allowDirectives: this.defaultAllow,
    };
  }

  getSeriesPlayerConfig(tmdbId, seasonNumber, episodeNumber, options = {}) {
    const cleanId = this.sanitizeId(tmdbId);
    const season = Math.max(1, Math.floor(seasonNumber || 1));
    const episode = Math.max(1, Math.floor(episodeNumber || 1));
    const fragment = this.buildFragment(options);
    return {
      streamUrl: `${this.baseUrl}/serie/${cleanId}/${season}/${episode}${fragment}`,
      allowDirectives: this.defaultAllow,
    };
  }
}

describe("PlaybackProvider — Geração Segura de URLs de Reprodução", () => {
  const provider = new WarezCdnPlaybackProvider("https://warezcdn.sbs");

  it("Gera URL correta para filmes com #noEpList por padrão", () => {
    const config = provider.getMoviePlayerConfig("501624");
    assert.strictEqual(
      config.streamUrl,
      "https://warezcdn.sbs/filme/501624#noEpList"
    );
    assert.match(config.allowDirectives, /autoplay/);
    assert.match(config.allowDirectives, /fullscreen/);
  });

  it("Gera URL correta para séries, animes e doramas com temporada e episódio", () => {
    const config = provider.getSeriesPlayerConfig("63174", 2, 5);
    assert.strictEqual(
      config.streamUrl,
      "https://warezcdn.sbs/serie/63174/2/5#noEpList"
    );
  });

  it("Aplica opções adicionais como cor personalizada e transparência", () => {
    const config = provider.getMoviePlayerConfig("501624", {
      transparent: true,
      color: "#e50914",
    });
    assert.strictEqual(
      config.streamUrl,
      "https://warezcdn.sbs/filme/501624#noEpList&transparent&color=e50914"
    );
  });

  it("Rejeita IDs maliciosos com caracteres não permitidos", () => {
    assert.throws(() => {
      provider.getMoviePlayerConfig("501624<script>alert(1)</script>");
    }, /ID de mídia inválido/);

    assert.throws(() => {
      provider.getMoviePlayerConfig("https://site-malicioso.com");
    }, /ID de mídia inválido/);
  });

  it("Garante números inteiros positivos para temporadas e episódios", () => {
    const config = provider.getSeriesPlayerConfig("63174", -5, 0);
    assert.strictEqual(
      config.streamUrl,
      "https://warezcdn.sbs/serie/63174/1/1#noEpList"
    );
  });
});
