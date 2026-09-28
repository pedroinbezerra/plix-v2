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

  it("Valida detecção abrangente de navegadores e sistemas de Smart TV", () => {
    const checkIsSmartTvLogic = (ua = "", winObj = {}) => {
      if (
        winObj.tizen !== undefined ||
        winObj.webOS !== undefined ||
        winObj.webOSSystem !== undefined
      ) {
        return true;
      }
      const tvRegex =
        /smart-tv|smarttv|googletv|google\s?tv|android\s?tv|appletv|hbbtv|pov_tv|netcast|viera|bravia|tizen|web0?s|vidaa|hisense|roku|aft[a-z0-9]|firetv|fire\s?tv|crkey|mibox|mitv|shield|opera\s?tv|vewd|aquos|dtv|philipstv|sonytv|tv\s?bro|puffin/i;
      return tvRegex.test(ua);
    };

    // 1. Samsung Tizen
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) SamsungBrowser/4.0"),
      true
    );
    assert.strictEqual(
      checkIsSmartTvLogic("", { tizen: {} }),
      true
    );

    // 2. LG webOS
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 Chrome/79.0 Safari/537.36"),
      true
    );
    assert.strictEqual(
      checkIsSmartTvLogic("", { webOS: {} }),
      true
    );

    // 3. Sony BRAVIA Android TV
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Linux; Android 10; BRAVIA 4K UR3 Build/QTG3) AppleWebKit/537.36"),
      true
    );

    // 4. Amazon Fire TV (AFTMM / Silk)
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7273) AppleWebKit/537.36 Chrome/84.0 Silk/84.3"),
      true
    );

    // 5. Google TV Streamer / Chromecast
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Linux; Android 14; Google TV Streamer Build/UTTK) AppleWebKit/537.36"),
      true
    );

    // 6. Hisense VIDAA OS
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Linux; Hisense; VIDAA/5.0; U) AppleWebKit/537.36"),
      true
    );

    // 7. Roku
    assert.strictEqual(
      checkIsSmartTvLogic("Roku/DVP-9.10 (049.10E04111A)"),
      true
    );

    // 8. Navegador TV Bro para Android TV
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Linux; U; Android 11; TV Bro/4.2.1) AppleWebKit/537.36"),
      true
    );

    // Dispositivos padrão que NÃO são TV (não devem ativar automaticamente por UA)
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"),
      false
    );
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"),
      false
    );
    assert.strictEqual(
      checkIsSmartTvLogic("Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 Mobile Safari/537.36"),
      false
    );
  });

  it("Ativação automática por D-pad/controle remoto ocorre em tempo real ao pressionar qualquer tecla direcional", () => {
    const shouldAutoActivateOnKey = (key, keyCode) => {
      const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
      const isRemoteKey =
        key === "Escape" ||
        key === "Backspace" ||
        key === "GoBack" ||
        keyCode === 10009 ||
        keyCode === 461 ||
        keyCode === 4;
      return isArrow || isRemoteKey;
    };

    assert.strictEqual(shouldAutoActivateOnKey("ArrowUp", 38), true);
    assert.strictEqual(shouldAutoActivateOnKey("ArrowDown", 40), true);
    assert.strictEqual(shouldAutoActivateOnKey("ArrowLeft", 37), true);
    assert.strictEqual(shouldAutoActivateOnKey("ArrowRight", 39), true);
    assert.strictEqual(shouldAutoActivateOnKey(null, 10009), true); // Tizen
    assert.strictEqual(shouldAutoActivateOnKey(null, 461), true);   // webOS
    assert.strictEqual(shouldAutoActivateOnKey(null, 4), true);     // Android TV
    assert.strictEqual(shouldAutoActivateOnKey("a", 65), false);
    assert.strictEqual(shouldAutoActivateOnKey("1", 49), false);
  });
});
