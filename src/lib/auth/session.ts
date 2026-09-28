import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "../db/prisma";

export const SESSION_COOKIE_NAME = "plix_session";
export const PROFILE_COOKIE_NAME = "plix_profile";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.delete({
        where: { token },
      });
    } catch {
      // Ignora erro se sessão já foi removida
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(PROFILE_COOKIE_NAME);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profiles: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user || user.profiles.length === 0) return null;

  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get(PROFILE_COOKIE_NAME)?.value;

  if (activeProfileId) {
    const found = user.profiles.find((p) => p.id === activeProfileId);
    if (found) return found;
  }

  return user.profiles[0];
}

export async function setActiveProfile(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE_NAME, profileId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}
