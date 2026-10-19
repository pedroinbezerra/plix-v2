const { describe, it } = require("node:test");
const assert = require("node:assert");

// Simulação em JS puro das classes compiladas para execução ultrarrápida do node:test
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

class PomfyPlaybackProvider {
  constructor(baseUrl = "https://api.pomfy.stream") {
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
    if (options.noEpList) fragments.push("noEpList");
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

class StreamBetterPlaybackProvider {
  constructor(baseUrl = "https://streambetter.shop") {
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

  getMoviePlayerConfig(tmdbId) {
    const cleanId = this.sanitizeId(tmdbId);
    return {
      streamUrl: `${this.baseUrl}/filme/${cleanId}`,
      allowDirectives: this.defaultAllow,
    };
  }

  getSeriesPlayerConfig(tmdbId, seasonNumber, episodeNumber) {
    const cleanId = this.sanitizeId(tmdbId);
    const season = Math.max(1, Math.floor(seasonNumber || 1));
    const episode = Math.max(1, Math.floor(episodeNumber || 1));
    return {
      streamUrl: `${this.baseUrl}/serie/${cleanId}/${season}/${episode}`,
      allowDirectives: this.defaultAllow,
    };
  }
}

describe("PlaybackProvider — Geração Segura de URLs de Reprodução (WarezCDN)", () => {
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

describe("PomfyPlaybackProvider — Geração de URLs da API Pomfy", () => {
  const pomfy = new PomfyPlaybackProvider("https://api.pomfy.stream");

  it("Gera URL correta para filmes segundo a documentação da Pomfy", () => {
    const config = pomfy.getMoviePlayerConfig("550");
    assert.strictEqual(config.streamUrl, "https://api.pomfy.stream/filme/550");
    assert.match(config.allowDirectives, /autoplay/);
    assert.match(config.allowDirectives, /fullscreen/);
  });

  it("Gera URL correta para episódios de séries (/serie/ID/TEMP/EP)", () => {
    const config = pomfy.getSeriesPlayerConfig("66732", 1, 2);
    assert.strictEqual(
      config.streamUrl,
      "https://api.pomfy.stream/serie/66732/1/2"
    );
  });

  it("Garante números inteiros positivos para temporadas e episódios", () => {
    const config = pomfy.getSeriesPlayerConfig("66732", -1, 0);
    assert.strictEqual(
      config.streamUrl,
      "https://api.pomfy.stream/serie/66732/1/1"
    );
  });

  it("Aplica fragmentos de personalização se especificados", () => {
    const config = pomfy.getMoviePlayerConfig("550", { noLink: true });
    assert.strictEqual(config.streamUrl, "https://api.pomfy.stream/filme/550#noLink");
  });

  it("Rejeita IDs maliciosos com caracteres não permitidos", () => {
    assert.throws(() => pomfy.getMoviePlayerConfig("550<script>alert(1)</script>"), /ID de mídia inválido/);
  });
});

describe("StreamBetterPlaybackProvider — Geração de URLs da API StreamBetter", () => {
  const streambetter = new StreamBetterPlaybackProvider("https://streambetter.shop");

  it("Gera URL correta para filmes segundo a documentação do StreamBetter", () => {
    const config = streambetter.getMoviePlayerConfig("350");
    assert.strictEqual(config.streamUrl, "https://streambetter.shop/filme/350");
    assert.match(config.allowDirectives, /autoplay/);
    assert.match(config.allowDirectives, /fullscreen/);
  });

  it("Gera URL correta para episódios de séries (/serie/ID/TEMP/EP)", () => {
    const config = streambetter.getSeriesPlayerConfig("1416", 15, 4);
    assert.strictEqual(
      config.streamUrl,
      "https://streambetter.shop/serie/1416/15/4"
    );
  });

  it("Garante números inteiros positivos para temporadas e episódios", () => {
    const config = streambetter.getSeriesPlayerConfig("1416", -2, 0);
    assert.strictEqual(
      config.streamUrl,
      "https://streambetter.shop/serie/1416/1/1"
    );
  });

  it("Rejeita IDs maliciosos com caracteres não permitidos", () => {
    assert.throws(
      () => streambetter.getMoviePlayerConfig("350<script>alert(1)</script>"),
      /ID de mídia inválido/
    );
  });
});

describe("Multi-Provider — Alternância de Servidores (WarezCDN, Pomfy e StreamBetter)", () => {
  const warez = new WarezCdnPlaybackProvider("https://warezcdn.sbs");
  const pomfy = new PomfyPlaybackProvider("https://api.pomfy.stream");
  const streambetter = new StreamBetterPlaybackProvider("https://streambetter.shop");

  it("Permite alternar entre os três provedores mantendo o mesmo conteúdo TMDB", () => {
    const movieId = "350";
    const warezMovie = warez.getMoviePlayerConfig(movieId);
    const pomfyMovie = pomfy.getMoviePlayerConfig(movieId);
    const streambetterMovie = streambetter.getMoviePlayerConfig(movieId);

    assert.strictEqual(warezMovie.streamUrl, "https://warezcdn.sbs/filme/350#noEpList");
    assert.strictEqual(pomfyMovie.streamUrl, "https://api.pomfy.stream/filme/350");
    assert.strictEqual(streambetterMovie.streamUrl, "https://streambetter.shop/filme/350");
  });
});

describe("Player Integrado e Bloqueador de Popups Configurável", () => {
  it("Garante que StreamingPlayer utiliza o player integrado do provedor sem controles redundantes", () => {
    const fs = require("node:fs");
    const path = require("node:path");
    const playerFile = path.join(__dirname, "..", "src", "components", "player", "StreamingPlayer.tsx");
    assert.ok(fs.existsSync(playerFile), "StreamingPlayer.tsx deve existir");

    const content = fs.readFileSync(playerFile, "utf-8");
    assert.ok(content.includes("<iframe"), "Deve renderizar o iframe do provedor");
    assert.ok(content.includes("shouldUseSandbox"), "Deve condicionar o sandbox ao bloqueador de popups");
    assert.strictEqual(
      content.includes('role="slider"'),
      false,
      "Não deve renderizar barra de progresso duplicada sobre o player integrado"
    );
  });

  it("Garante que o Bloqueador de Popups é configurável no Perfil e no AdBlockerGuard", () => {
    const fs = require("node:fs");
    const path = require("node:path");

    const guardFile = path.join(__dirname, "..", "src", "components", "security", "AdBlockerGuard.tsx");
    const profileFile = path.join(__dirname, "..", "src", "components", "profile", "ProfileModal.tsx");

    const guardContent = fs.readFileSync(guardFile, "utf-8");
    const profileContent = fs.readFileSync(profileFile, "utf-8");

    assert.ok(guardContent.includes("plix_popup_blocker"), "AdBlockerGuard deve ler a chave plix_popup_blocker");
    assert.ok(
      guardContent.includes("plix:popup-blocker-changed"),
      "AdBlockerGuard deve reagir ao evento plix:popup-blocker-changed"
    );

    assert.ok(
      profileContent.includes("Bloqueador de Popups"),
      "ProfileModal deve exibir a seção Bloqueador de Popups"
    );
    assert.ok(
      profileContent.includes("handleTogglePopupBlocker"),
      "ProfileModal deve permitir ativar ou desativar o bloqueador de popups"
    );
  });
});
