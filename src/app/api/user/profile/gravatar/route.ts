import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { buildGravatarUrl, GRAVATAR_STYLES } from "@/lib/gravatar";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get("email");
  const style = searchParams.get("style") || "identicon";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Informe um endereço de e-mail válido" },
      { status: 400 }
    );
  }

  const validStyle = GRAVATAR_STYLES.some((s) => s.id === style)
    ? style
    : "identicon";

  const gravatarUrl = buildGravatarUrl(email, {
    size: 200,
    defaultStyle: validStyle,
    rating: "g",
  });

  // Verifica se o usuário possui foto real cadastrada ou se usará o fallback
  let hasCustomPhoto = false;
  try {
    const checkUrl = buildGravatarUrl(email, { defaultStyle: "404" });
    const response = await fetch(checkUrl, {
      method: "HEAD",
      next: { revalidate: 3600 },
    });
    hasCustomPhoto = response.ok;
  } catch {
    hasCustomPhoto = false;
  }

  return NextResponse.json({
    url: gravatarUrl,
    hasCustomPhoto,
    email: email.trim().toLowerCase(),
    style: validStyle,
  });
}
