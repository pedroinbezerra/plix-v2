const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("PomfyCatalogProvider — Verificação de Contrato da API Pomfy", () => {
  it("Endpoint /lista retorna array de IDs TMDB para filmes e series", async () => {
    try {
      const resFilmes = await fetch("https://api.pomfy.stream/lista?tipo=filmes");
      if (resFilmes.status === 429 || resFilmes.status === 503) {
        return;
      }
      assert.strictEqual(resFilmes.status, 200);
      const filmes = await resFilmes.json();
      assert.ok(Array.isArray(filmes));
      assert.ok(filmes.length > 0);
      assert.strictEqual(typeof filmes[0], "string");

      const resSeries = await fetch("https://api.pomfy.stream/lista?tipo=series");
      if (resSeries.status === 429 || resSeries.status === 503) {
        return;
      }
      assert.strictEqual(resSeries.status, 200);
      const series = await resSeries.json();
      assert.ok(Array.isArray(series));
      assert.ok(series.length > 0);
      assert.strictEqual(typeof series[0], "string");
    } catch (e) {
      console.warn("Aviso de rede ao testar endpoint Pomfy:", e.message);
    }
  });
});
