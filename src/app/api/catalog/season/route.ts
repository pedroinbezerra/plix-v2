import { NextRequest, NextResponse } from "next/server";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const seasonNumber = parseInt(searchParams.get("seasonNumber") || "1", 10);

  if (!tmdbId) {
    return NextResponse.json({ error: "tmdbId é obrigatório" }, { status: 400 });
  }

  try {
    const seasonDetails = await metadataProvider.getSeasonDetails(tmdbId, seasonNumber);
    return NextResponse.json(seasonDetails);
  } catch (error) {
    console.error(`Erro ao buscar temporada ${seasonNumber} de ${tmdbId}:`, error);
    return NextResponse.json(
      { error: "Erro ao buscar detalhes da temporada" },
      { status: 500 }
    );
  }
}
