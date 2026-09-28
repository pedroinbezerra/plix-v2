import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const currentProfile = await getCurrentProfile();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        profiles: user.profiles,
      },
      currentProfile,
    });
  } catch (error) {
    console.error("Erro na rota me:", error);
    return NextResponse.json({ error: "Erro ao obter usuário" }, { status: 500 });
  }
}
