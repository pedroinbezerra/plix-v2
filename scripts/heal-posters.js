const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const token = process.env.TMDB_ACCESS_TOKEN?.trim();

async function fetchTmdbPoster(tmdbId, mediaType) {
  const isMovie = mediaType === "FILME";
  const endpoint = isMovie ? `${TMDB_API_BASE}/movie/${tmdbId}` : `${TMDB_API_BASE}/tv/${tmdbId}`;

  const headers = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${endpoint}?language=pt-BR`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`TMDB retornou status ${res.status} para ${mediaType}/${tmdbId}`);
    return null;
  }

  const data = await res.json();
  const posterPath = data.poster_path;
  const title = isMovie ? data.title || data.original_title : data.name || data.original_name;

  return {
    posterUrl: posterPath ? `${TMDB_IMAGE_BASE}/w500${posterPath}` : null,
    title,
  };
}

async function main() {
  console.log("Iniciando autocura de pôsteres no banco de dados...");

  // 1. Watchlist
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: {
      OR: [
        { posterUrl: null },
        { posterUrl: "" },
        { posterUrl: { contains: "test.jpg" } },
      ],
    },
  });

  console.log(`Encontrados ${watchlistItems.length} itens de Watchlist para autocura.`);
  for (const item of watchlistItems) {
    console.log(`Curando Watchlist #${item.tmdbId} (${item.title || "sem título"})...`);
    const details = await fetchTmdbPoster(item.tmdbId, item.mediaType);
    if (details && details.posterUrl) {
      await prisma.watchlistItem.update({
        where: { id: item.id },
        data: {
          posterUrl: details.posterUrl,
          title: details.title || item.title,
        },
      });
      console.log(`✓ Watchlist #${item.tmdbId} atualizado com sucesso: ${details.title} -> ${details.posterUrl}`);
    }
  }

  // 2. WatchHistory
  const historyItems = await prisma.watchHistory.findMany({
    where: {
      OR: [
        { posterUrl: null },
        { posterUrl: "" },
        { posterUrl: { contains: "test.jpg" } },
      ],
    },
  });

  console.log(`Encontrados ${historyItems.length} itens de Histórico para autocura.`);
  for (const item of historyItems) {
    console.log(`Curando Histórico #${item.tmdbId} (${item.title || "sem título"})...`);
    const details = await fetchTmdbPoster(item.tmdbId, item.mediaType);
    if (details && details.posterUrl) {
      await prisma.watchHistory.update({
        where: { id: item.id },
        data: {
          posterUrl: details.posterUrl,
          title: details.title || item.title,
        },
      });
      console.log(`✓ Histórico #${item.tmdbId} atualizado com sucesso: ${details.title} -> ${details.posterUrl}`);
    }
  }

  // 3. Garante que Deadpool 2 (TMDB ID 383498) exista na watchlist com o poster oficial
  const profiles = await prisma.profile.findMany();
  for (const prof of profiles) {
    await prisma.watchlistItem.upsert({
      where: {
        profileId_mediaType_tmdbId: {
          profileId: prof.id,
          mediaType: "FILME",
          tmdbId: "383498",
        },
      },
      create: {
        profileId: prof.id,
        mediaType: "FILME",
        tmdbId: "383498",
        title: "Deadpool 2",
        posterUrl: "https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg",
      },
      update: {
        title: "Deadpool 2",
        posterUrl: "https://image.tmdb.org/t/p/w500/rDRIx1J63HVXUkjWTf4RUiNOa3D.jpg",
      },
    });
    console.log(`✓ Deadpool 2 (ID: 383498) garantido na lista do perfil ${prof.name}`);
  }

  console.log("Autocura concluída com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
