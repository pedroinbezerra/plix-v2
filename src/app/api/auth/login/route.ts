import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setActiveProfile } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: String(username).trim() },
      include: {
        profiles: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Criar sessão segura
    await createSession(user.id);

    // Selecionar o primeiro perfil como padrão
    if (user.profiles.length > 0) {
      await setActiveProfile(user.profiles[0].id);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        profiles: user.profiles,
      },
    });
  } catch (error) {
    console.error("Erro na rota de login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar login" },
      { status: 500 }
    );
  }
}
