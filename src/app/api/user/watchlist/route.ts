import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ inWatchlist: false });
    } else {
      // Adiciona à lista
      await prisma.watchlistItem.create({
        data: {
          profileId: profile.id,
          mediaType: mediaType as MediaType,
          tmdbId: String(tmdbId),
          title: title || null,
          posterUrl: posterUrl || null,
        },
      });
      return NextResponse.json({ inWatchlist: true });
    }
  } catch (error) {
    console.error("Erro ao alterar Watchlist:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
