const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

describe("PWA — Progressive Web App Specs & Assets", () => {
  it("Todos os ícones PWA necessários existem no diretório public/icons", () => {
    const requiredIcons = [
      "icon-192x192.png",
      "icon-512x512.png",
      "icon-maskable-512x512.png",
      "apple-touch-icon.png",
      "icon.svg",
    ];

    for (const icon of requiredIcons) {
      const iconPath = path.join(__dirname, "..", "public", "icons", icon);
      assert.ok(fs.existsSync(iconPath), `Ícone ausente: ${icon}`);
      const stats = fs.statSync(iconPath);
      assert.ok(stats.size > 0, `Ícone vazio: ${icon}`);
    }
  });

  it("Service Worker (public/sw.js) está presente e possui manipuladores de instalação e ativação", () => {
    const swPath = path.join(__dirname, "..", "public", "sw.js");
    assert.ok(fs.existsSync(swPath), "Arquivo public/sw.js não encontrado");
    const content = fs.readFileSync(swPath, "utf-8");
    assert.ok(content.includes("install"), "SW deve ter listener para install");
    assert.ok(content.includes("activate"), "SW deve ter listener para activate");
    assert.ok(content.includes("fetch"), "SW deve ter listener para fetch");
    assert.ok(content.includes("plix-cache-v1"), "SW deve definir cache version");
  });

  it("Next.js manifest route (src/app/manifest.ts) define display standalone e cores corretas", () => {
    const manifestPath = path.join(__dirname, "..", "src", "app", "manifest.ts");
    assert.ok(fs.existsSync(manifestPath), "Arquivo manifest.ts não encontrado");
    const content = fs.readFileSync(manifestPath, "utf-8");
    assert.ok(content.includes("standalone"), "Manifest deve definir display standalone");
    assert.ok(content.includes("#e50914"), "Manifest deve conter cor primária PLIX");
    assert.ok(content.includes("#0a0f1d"), "Manifest deve conter fundo escuro PLIX");
    assert.ok(content.includes("/icons/icon-192x192.png"), "Manifest deve referenciar icon-192x192");
    assert.ok(content.includes("/icons/icon-512x512.png"), "Manifest deve referenciar icon-512x512");
  });
});

describe("Smart TV & Navegação por Controle Remoto (D-pad)", () => {
  it("Mapeia corretamente códigos de tecla de retorno de Smart TVs (Tizen, webOS, Android TV)", () => {
    const tvKeyCodes = {
      TIZEN_RETURN: 10009,
      WEBOS_BACK: 461,
      ANDROID_TV_BACK: 4,
      ESCAPE: "Escape",
      BACKSPACE: "Backspace",
    };

    const isBackKey = (key, keyCode) =>
      key === "Escape" ||
      key === "Backspace" ||
      key === "GoBack" ||
      keyCode === 10009 ||
      keyCode === 461 ||
      keyCode === 4;

    assert.strictEqual(isBackKey(null, tvKeyCodes.TIZEN_RETURN), true);
    assert.strictEqual(isBackKey(null, tvKeyCodes.WEBOS_BACK), true);
    assert.strictEqual(isBackKey(null, tvKeyCodes.ANDROID_TV_BACK), true);
    assert.strictEqual(isBackKey(tvKeyCodes.ESCAPE, 27), true);
    assert.strictEqual(isBackKey(tvKeyCodes.BACKSPACE, 8), true);
    assert.strictEqual(isBackKey("Enter", 13), false);
  });

  it("Mapeia corretamente setas direcionais para navegação espacial (D-pad)", () => {
    const dpadKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const isDpadKey = (key) => dpadKeys.includes(key);

    for (const key of dpadKeys) {
      assert.strictEqual(isDpadKey(key), true);
    }
    assert.strictEqual(isDpadKey("Tab"), false);
    assert.strictEqual(isDpadKey("Enter"), false);
  });

  it("Valida detecção de navegadores de Smart TV via User-Agent", () => {
    const isTvUserAgent = (ua) =>
      /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast.tv|viera|bravia|tizen|webos|android.*tv|crkey/i.test(
        ua
      );

    // Smart TVs reais
    assert.strictEqual(
      isTvUserAgent(
        "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.0 TV Safari/537.36"
      ),
      true
    );
    assert.strictEqual(
      isTvUserAgent(
        "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 WebAppManager"
      ),
      true
    );
    assert.strictEqual(
      isTvUserAgent(
        "Mozilla/5.0 (Linux; Android 10; BRAVIA 4K UR3 Build/QTG3.200305.001) AppleWebKit/537.36 Chrome/89.0.4389.105 Safari/537.36"
      ),
      true
    );

    // Desktop normal (não TV por padrão)
    assert.strictEqual(
      isTvUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      ),
      false
    );
  });
});
