import { NextRequest, NextResponse } from "next/server";
import { metadataProvider } from "@/providers/metadata/tmdb-metadata.provider";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await metadataProvider.search(q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erro na busca de títulos:", error);
    return NextResponse.json({ error: "Erro ao processar busca" }, { status: 500 });
  }
}
