import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MediaType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const mediaType = searchParams.get("mediaType") as MediaType;

  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: "tmdbId e mediaType são obrigatórios" }, { status: 400 });
  }

  const item = await prisma.watchlistItem.findUnique({
    where: {
      profileId_mediaType_tmdbId: {
        profileId: profile.id,
        mediaType,
        tmdbId,
      },
    },
  });

  return NextResponse.json({ inWatchlist: !!item });
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { tmdbId, mediaType, title, posterUrl } = body;

    if (!tmdbId || !mediaType) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        profileId_mediaType_tmdbId: {
          profileId: profile.id,
          mediaType: mediaType as MediaType,
          tmdbId: String(tmdbId),
        },
      },
    });

    if (existing) {
      // Remove da lista
      await prisma.watchlistItem.delete({
        where: { id: existing.id },
      });
      revalidatePath("/", "page");
      revalidatePath("/minha-lista", "page");
      return NextResponse.json({ inWatchlist: false });
    }

    // Auto-resolve poster e título a partir do TMDB se não informados ou inválidos
      let finalTitle = title;
      let finalPosterUrl = posterUrl;

      if (!finalPosterUrl || finalPosterUrl.includes("test.jpg") || !finalTitle) {
        try {
          const { metadataProvider } = await import("@/providers/metadata/tmdb-metadata.provider");
          const details = await metadataProvider.getDetails(String(tmdbId), mediaType as MediaType);
          if (details.posterUrl) finalPosterUrl = details.posterUrl;
          if (!finalTitle || finalTitle.startsWith("Item #")) finalTitle = details.title;
        } catch (err) {
          console.warn(`Erro ao resolver metadados para Watchlist #${tmdbId}:`, err);
        }
      }

      // Adiciona à lista
      await prisma.watchlistItem.create({
        data: {
          profileId: profile.id,
          mediaType: mediaType as MediaType,
          tmdbId: String(tmdbId),
          title: finalTitle || null,
          posterUrl: finalPosterUrl || null,
        },
      });

      revalidatePath("/", "page");
      revalidatePath("/minha-lista", "page");
      return NextResponse.json({ inWatchlist: true });
  } catch (error) {
    console.error("Erro ao alterar Watchlist:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
