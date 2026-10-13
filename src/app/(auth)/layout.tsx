export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Se o usuário já estiver autenticado, impede o acesso à tela de login e redireciona para a home
  if (user) {
    redirect("/");
  }

  return <>{children}</>;
}
