const { describe, it } = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://127.0.0.1:3000";

describe("E2E Plix — Fluxo Crítico de Navegação, Autenticação e Reprodução", () => {
  let sessionCookie = "";

  it("1. Rota protegida sem autenticação redireciona para login", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert.strictEqual(res.status, 401);
  });

  it("2. Login com credenciais de administrador obtém sessão e perfil", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "password123",
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.username, "admin");

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie);
    assert.match(setCookie, /plix_session=/);
    sessionCookie = setCookie.split(";")[0];
  });

  it("3. Verificação de sessão (/api/auth/me) com cookie ativo", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.username, "admin");
    assert.strictEqual(data.currentProfile.name, "Principal");
  });

  it("4. Alternar item na Minha Lista (Watchlist)", async () => {
    // Garante estado limpo antes do teste
    const checkRes = await fetch(
      `${BASE_URL}/api/user/watchlist?tmdbId=501624&mediaType=FILME`,
      { headers: { Cookie: sessionCookie } }
    );
    const checkData = await checkRes.json();
    if (checkData.inWatchlist) {
      // Se já estava, remove primeiro
      await fetch(`${BASE_URL}/api/user/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          tmdbId: "501624",
          mediaType: "FILME",
          title: "Deadpool 2",
        }),
      });
    }

    // 1. Adicionar à lista
    const addRes = await fetch(`${BASE_URL}/api/user/watchlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        tmdbId: "501624",
        mediaType: "FILME",
        title: "Deadpool 2",
        posterUrl: "https://image.tmdb.org/t/p/w500/test.jpg",
      }),
    });

    assert.strictEqual(addRes.status, 200);
    const addData = await addRes.json();
    assert.strictEqual(addData.inWatchlist, true);

    // Consulta de status
    const statusRes = await fetch(
      `${BASE_URL}/api/user/watchlist?tmdbId=501624&mediaType=FILME`,
      { headers: { Cookie: sessionCookie } }
    );
    assert.strictEqual(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.inWatchlist, true);
  });

  it("5. Registrar histórico de reprodução e continuar assistindo", async () => {
    const histRes = await fetch(`${BASE_URL}/api/user/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        tmdbId: "63174",
        mediaType: "SERIE",
        seasonNumber: 1,
        episodeNumber: 3,
        isCompleted: false,
        title: "Lucifer",
        posterUrl: "https://image.tmdb.org/t/p/w500/lucifer.jpg",
      }),
    });

    assert.strictEqual(histRes.status, 200);
    const histData = await histRes.json();
    assert.strictEqual(histData.success, true);
    assert.strictEqual(histData.record.seasonNumber, 1);
    assert.strictEqual(histData.record.episodeNumber, 3);
    assert.strictEqual(histData.record.isCompleted, false);

    // Listagem de histórico
    const listRes = await fetch(`${BASE_URL}/api/user/history`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData));
    assert.ok(listData.some((item) => item.tmdbId === "63174"));
  });

  it("6. Carregar Home Page com cookie autenticado", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("PLIX"));
    assert.ok(html.includes("Filmes"));
    assert.ok(html.includes("Séries"));
  });

  it("7. Carregar Página de Detalhes de um filme", async () => {
    const res = await fetch(`${BASE_URL}/detalhes/filme/501624`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Assistir"));
    assert.ok(html.includes("Minha Lista"));
  });

  it("8. Carregar Página de Reprodução (Player) com iframe seguro", async () => {
    const res = await fetch(`${BASE_URL}/assistir/filme/501624`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("iframe"));
    assert.ok(html.includes("https://warezcdn.sbs/filme/501624#noEpList"));
  });

  it("9. Carregar Minha Lista e Histórico em HTML", async () => {
    const resList = await fetch(`${BASE_URL}/minha-lista`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(resList.status, 200);

    const resHist = await fetch(`${BASE_URL}/historico`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(resHist.status, 200);
  });
});
