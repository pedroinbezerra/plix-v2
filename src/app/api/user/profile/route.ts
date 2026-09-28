import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentProfile, setActiveProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const currentProfile = await getCurrentProfile();
  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
    currentProfile,
    profiles,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { name, avatar } = body;

    const dataToUpdate: { name?: string; avatar?: string } = {};

    if (name && typeof name === "string") {
      const cleanName = name.trim();
      if (cleanName.length < 2 || cleanName.length > 30) {
        return NextResponse.json(
          { error: "O nome deve ter entre 2 e 30 caracteres" },
          { status: 400 }
        );
      }
      dataToUpdate.name = cleanName;
    }

    if (avatar && typeof avatar === "string") {
      dataToUpdate.avatar = avatar.trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado informado para atualização" },
        { status: 400 }
      );
    }

    const updated = await prisma.profile.update({
      where: { id: currentProfile.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar dados do perfil" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, avatar = "avatar-1" } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nome de perfil inválido" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    // Limite de perfis por conta
    const count = await prisma.profile.count({ where: { userId: user.id } });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Limite máximo de 5 perfis atingido" },
        { status: 400 }
      );
    }

    const newProfile = await prisma.profile.create({
      data: {
        userId: user.id,
        name: cleanName,
        avatar: String(avatar).trim() || "avatar-1",
      },
    });

    await setActiveProfile(newProfile.id);

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (error) {
    console.error("Erro ao criar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao criar novo perfil" },
      { status: 500 }
    );
  }
}
