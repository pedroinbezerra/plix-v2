const { describe, it } = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

function buildGravatarUrl(email, options = {}) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return "";

  const hash = crypto.createHash("sha256").update(cleanEmail).digest("hex");
  const size = Math.min(512, Math.max(32, options.size || 200));
  const defaultStyle = options.defaultStyle || "identicon";
  const rating = options.rating || "g";

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${encodeURIComponent(defaultStyle)}&r=${rating}`;
}

function isGravatarUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("gravatar.com/avatar/");
}

describe("Gravatar — Integração e Resolução de Avatares", () => {
  it("Gera URL válida do Gravatar com hash SHA-256 e normalização de e-mail", () => {
    const email = "  Pedro.Exemplo@Plix.Local  ";
    const url = buildGravatarUrl(email);

    const expectedHash = crypto
      .createHash("sha256")
      .update("pedro.exemplo@plix.local")
      .digest("hex");

    assert.ok(url.startsWith("https://www.gravatar.com/avatar/"));
    assert.ok(url.includes(expectedHash));
    assert.ok(url.includes("s=200"));
    assert.ok(url.includes("d=identicon"));
  });

  it("Aplica parâmetros personalizados de estilo padrão e tamanho", () => {
    const url = buildGravatarUrl("teste@plix.local", {
      size: 128,
      defaultStyle: "retro",
    });

    assert.ok(url.includes("s=128"));
    assert.ok(url.includes("d=retro"));
  });

  it("Retorna string vazia para e-mails nulos ou vazios", () => {
    assert.strictEqual(buildGravatarUrl(""), "");
    assert.strictEqual(buildGravatarUrl(null), "");
    assert.strictEqual(buildGravatarUrl(undefined), "");
  });

  it("Identifica corretamente URLs pertencentes ao Gravatar", () => {
    assert.strictEqual(
      isGravatarUrl("https://www.gravatar.com/avatar/abc123456?s=200"),
      true
    );
    assert.strictEqual(
      isGravatarUrl("https://secure.gravatar.com/avatar/abc123456?s=200"),
      true
    );
    assert.strictEqual(isGravatarUrl("avatar-1"), false);
    assert.strictEqual(isGravatarUrl("https://image.tmdb.org/t/p/w500/test.jpg"), false);
    assert.strictEqual(isGravatarUrl(null), false);
  });
});
