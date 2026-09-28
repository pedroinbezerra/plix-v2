import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plix — Streaming Pessoal",
    short_name: "Plix",
    description: "Plataforma pessoal de streaming de filmes, séries, animes e doramas",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f1d",
    theme_color: "#e50914",
    orientation: "any",
    categories: ["entertainment", "movies"],
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
