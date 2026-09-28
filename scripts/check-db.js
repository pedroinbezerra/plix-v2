const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const watchlist = await prisma.watchlistItem.findMany();
  console.log("Watchlist count:", watchlist.length);
  for (const item of watchlist) {
    console.log(`- [${item.mediaType}] tmdbId: ${item.tmdbId} | title: ${item.title} | posterUrl: ${item.posterUrl}`);
  }

  const history = await prisma.watchHistory.findMany();
  console.log("History count:", history.length);
  for (const item of history) {
    console.log(`- [${item.mediaType}] tmdbId: ${item.tmdbId} | title: ${item.title} | posterUrl: ${item.posterUrl}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
