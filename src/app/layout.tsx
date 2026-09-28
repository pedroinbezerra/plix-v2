import type { Metadata } from "next";
import { AdBlockerGuard } from "@/components/security/AdBlockerGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plix — Streaming Pessoal",
  description: "Plataforma pessoal de streaming de filmes, séries, animes e doramas",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased selection:bg-primary selection:text-white">
        <AdBlockerGuard />
        {children}
      </body>
    </html>
  );
}
