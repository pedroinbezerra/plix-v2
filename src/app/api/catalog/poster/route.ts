import { NextRequest, NextResponse } from "next/server";
import { MediaType } from "@prisma/client";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const tmdbId = searchParams.get("tmdbId");
  const mediaTypeStr = searchParams.get("mediaType");

  if (!tmdbId || !mediaTypeStr) {
    return NextResponse.json(
      { error: "tmdbId e mediaType são obrigatórios" },
      { status: 400 }
    );
  }

  const normalizedType = mediaTypeStr.toUpperCase() as MediaType;
  if (!["FILME", "SERIE", "ANIME", "DORAMA"].includes(normalizedType)) {
    return NextResponse.json({ error: "Tipo de mídia inválido" }, { status: 400 });
  }

  try {
    const details = await metadataProvider.getDetails(tmdbId, normalizedType);

    // Se houver perfil ativo, autocura o registro no banco caso estivesse sem pôster
    const profile = await getCurrentProfile().catch(() => null);
    if (profile && details.posterUrl) {
      // 1. Atualiza Watchlist se estiver sem poster ou com poster quebrado
      await prisma.watchlistItem.updateMany({
        where: {
          profileId: profile.id,
          tmdbId: String(tmdbId),
          mediaType: normalizedType,
          OR: [
            { posterUrl: null },
            { posterUrl: "" },
            { posterUrl: { contains: "test.jpg" } },
          ],
        },
        data: {
          posterUrl: details.posterUrl,
          title: details.title,
        },
      }).catch(() => {});

      // 2. Atualiza WatchHistory
      await prisma.watchHistory.updateMany({
        where: {
          profileId: profile.id,
          tmdbId: String(tmdbId),
          mediaType: normalizedType,
          OR: [
            { posterUrl: null },
            { posterUrl: "" },
            { posterUrl: { contains: "test.jpg" } },
          ],
        },
        data: {
          posterUrl: details.posterUrl,
          title: details.title,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      id: details.id,
      mediaType: details.mediaType,
      title: details.title,
      posterUrl: details.posterUrl,
      backdropUrl: details.backdropUrl,
      releaseYear: details.releaseYear,
      voteAverage: details.voteAverage,
    });
  } catch (error) {
    console.warn(`[PosterAPI] Erro ao recuperar pôster para ${mediaTypeStr}/${tmdbId}:`, error);
    return NextResponse.json(
      { error: "Erro ao buscar pôster nos metadados" },
      { status: 500 }
    );
  }
}
