const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("CatalogProvider — Verificação de Contrato da API Externa", () => {
  it("Endpoint /lista retorna array de IDs para filme e serie", async () => {
    const resFilme = await fetch("https://warezcdn.sbs/lista?category=filme&type=tmdb&format=json");
    if (resFilme.status === 429) {
      // Provedor externo em rate limit temporário
      return;
    }
    assert.strictEqual(resFilme.status, 200);
    const filmes = await resFilme.json();
    assert.ok(Array.isArray(filmes));
    assert.ok(filmes.length > 100);
    assert.strictEqual(typeof filmes[0], "string");

    const resSerie = await fetch("https://warezcdn.sbs/lista?category=serie&type=tmdb&format=json");
    if (resSerie.status === 429) return;
    assert.strictEqual(resSerie.status, 200);
    const series = await resSerie.json();
    assert.ok(Array.isArray(series));
    assert.ok(series.length > 50);
  });

  it("Endpoint /lista gêneros retorna lista de gêneros com slugs válidos", async () => {
    const res = await fetch("https://warezcdn.sbs/lista?category=filme&type=generos&format=json");
    if (res.status === 429) {
      return;
    }
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length > 0);
    assert.ok(json.data[0].slug);
    assert.ok(json.data[0].name);
  });
});
