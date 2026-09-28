import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MediaType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const history = await prisma.watchHistory.findMany({
      where: { profileId: profile.id },
      orderBy: { lastWatchedAt: "desc" },
      take: 60,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Erro ao obter histórico:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      tmdbId,
      mediaType,
      seasonNumber,
      episodeNumber,
      isCompleted = false,
      title,
      posterUrl,
    } = body;

    if (!tmdbId || !mediaType) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const season = seasonNumber !== undefined && seasonNumber !== null ? Number(seasonNumber) : 0;
    const episode = episodeNumber !== undefined && episodeNumber !== null ? Number(episodeNumber) : 0;

    const record = await prisma.watchHistory.upsert({
      where: {
        profileId_mediaType_tmdbId_seasonNumber_episodeNumber: {
          profileId: profile.id,
          mediaType: mediaType as MediaType,
          tmdbId: String(tmdbId),
          seasonNumber: season,
          episodeNumber: episode,
        },
      },
      create: {
        profileId: profile.id,
        mediaType: mediaType as MediaType,
        tmdbId: String(tmdbId),
        seasonNumber: season,
        episodeNumber: episode,
        isCompleted: Boolean(isCompleted),
        title: title || null,
        posterUrl: posterUrl || null,
        lastWatchedAt: new Date(),
      },
      update: {
        isCompleted: Boolean(isCompleted),
        lastWatchedAt: new Date(),
        ...(title ? { title } : {}),
        ...(posterUrl ? { posterUrl } : {}),
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Erro ao registrar histórico:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.watchHistory.deleteMany({
        where: { id, profileId: profile.id },
      });
    } else {
      // Limpar todo o histórico do perfil
      await prisma.watchHistory.deleteMany({
        where: { profileId: profile.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar histórico:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
