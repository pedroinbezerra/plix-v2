import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setActiveProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId é obrigatório" }, { status: 400 });
    }

    const profile = await prisma.profile.findFirst({
      where: { id: String(profileId), userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    await setActiveProfile(profile.id);

    return NextResponse.json({ success: true, activeProfile: profile });
  } catch (error) {
    console.error("Erro ao trocar de perfil:", error);
    return NextResponse.json({ error: "Erro ao trocar de perfil" }, { status: 500 });
  }
}
