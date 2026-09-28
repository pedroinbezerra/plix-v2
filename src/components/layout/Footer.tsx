import React from "react";
import Link from "next/link";
import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-background py-8 px-4 sm:px-8 text-xs text-gray-500 mb-14 md:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span className="font-semibold text-gray-400">PLIX Homelab</span>
          <span>•</span>
          <span>Streaming Pessoal & Doméstico</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/sobre" className="hover:text-gray-300 transition-colors">
            Sobre & Atribuição TMDB
          </Link>
          <Link href="/minha-lista" className="hover:text-gray-300 transition-colors">
            Minha Lista
          </Link>
          <Link href="/historico" className="hover:text-gray-300 transition-colors">
            Histórico
          </Link>
        </div>
      </div>
    </footer>
  );
}
