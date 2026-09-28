import type { Metadata, Viewport } from "next";
import { AdBlockerGuard } from "@/components/security/AdBlockerGuard";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";
import { SpatialNavigation } from "@/components/tv/SpatialNavigation";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0f1d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Plix — Streaming Pessoal",
  description: "Plataforma pessoal de streaming de filmes, séries, animes e doramas",
  applicationName: "Plix",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Plix",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <SpatialNavigation />
        <PWAInstaller />
        {children}
      </body>
    </html>
  );
}
