const { describe, it } = require("node:test");
const assert = require("node:assert");

// Simulação da lógica de catálogo de avatares
const AVATAR_PRESETS = [
  { id: "avatar-1", name: "Crimson Cinema", accentColor: "#e50914" },
  { id: "avatar-2", name: "Deep Ocean", accentColor: "#2563eb" },
  { id: "avatar-3", name: "Emerald Stream", accentColor: "#10b981" },
  { id: "avatar-4", name: "Purple Neon", accentColor: "#9333ea" },
  { id: "avatar-5", name: "Golden Crown", accentColor: "#f59e0b" },
  { id: "avatar-6", name: "Rose Romance", accentColor: "#f43f5e" },
  { id: "avatar-7", name: "Cyber Cyan", accentColor: "#06b6d4" },
  { id: "avatar-8", name: "Sunset Happy", accentColor: "#ea580c" },
];

function getAvatarPreset(avatarId) {
  const found = AVATAR_PRESETS.find((p) => p.id === avatarId);
  return found || AVATAR_PRESETS[0];
}

describe("Profile — Presets de Avatar e Personalização", () => {
  it("Retorna o preset correto quando o id é válido", () => {
    const preset = getAvatarPreset("avatar-3");
    assert.strictEqual(preset.id, "avatar-3");
    assert.strictEqual(preset.name, "Emerald Stream");
    assert.strictEqual(preset.accentColor, "#10b981");
  });

  it("Retorna o preset padrão (avatar-1) quando o id for nulo, indefinido ou desconhecido", () => {
    assert.strictEqual(getAvatarPreset(null).id, "avatar-1");
    assert.strictEqual(getAvatarPreset(undefined).id, "avatar-1");
    assert.strictEqual(getAvatarPreset("avatar-desconhecido").id, "avatar-1");
  });

  it("Todos os 8 presets possuem id, nome e cor de destaque válidos", () => {
    assert.strictEqual(AVATAR_PRESETS.length, 8);
    for (const p of AVATAR_PRESETS) {
      assert.ok(p.id.startsWith("avatar-"));
      assert.ok(p.name.length > 0);
      assert.match(p.accentColor, /^#[0-9a-fA-F]{6}$/);
    }
  });
});
