export const dynamic = "force-dynamic";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Film, Shield, Server, Tv, Smartphone, Laptop } from "lucide-react";

export default function SobrePage() {
  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-4xl mx-auto min-h-screen pb-16">
      {/* Cabeçalho */}
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white text-black shadow-2xl shadow-white/20 mb-4">
          <Film className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
          PLIX
        </h1>
        <p className="text-base sm:text-lg text-gray-400">
          Plataforma Pessoal & Homelab com Experiência Apple TV
        </p>
      </div>

      <div className="space-y-8 text-gray-300">
        {/* Seção Sobre o Projeto */}
        <section className="p-6 sm:p-8 rounded-3xl apple-glass-card shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
              <Server className="w-4 h-4 text-white" />
            </div>
            <span>Sobre o Sistema</span>
          </h2>
          <p className="leading-relaxed mb-6 text-sm sm:text-base text-gray-300">
            O <strong>Plix</strong> foi concebido para fornecer uma experiência fluida, limpa e moderna inspirada na estética do Apple TV e tvOS para consumo pessoal de filmes, séries, animes e doramas na rede local doméstica.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <Tv className="w-6 h-6 text-blue-400 mb-2.5" />
              <h3 className="font-semibold text-white text-sm mb-1">Smart TV & D-Pad</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Navegação espacial fluida com halos de foco luminosos brancos para controle remoto.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <Smartphone className="w-6 h-6 text-emerald-400 mb-2.5" />
              <h3 className="font-semibold text-white text-sm mb-1">Mobile First & PWA</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Interface tátil responsiva instalável como Progressive Web App.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <Laptop className="w-6 h-6 text-amber-400 mb-2.5" />
              <h3 className="font-semibold text-white text-sm mb-1">Desktop & Tablets</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Layout widescreen cinema com carrossel Featured Shelf e navegação cápsula.
              </p>
            </div>
          </div>
        </section>

        {/* Atribuição Obrigatória do TMDB */}
        <section className="p-6 sm:p-8 rounded-3xl apple-glass-card shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span>Atribuição de Dados — The Movie Database (TMDB)</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* TMDB Badge visual */}
            <div className="w-32 h-14 bg-gradient-to-r from-[#01b4e4] to-[#90cea1] rounded-2xl flex items-center justify-center font-black text-slate-900 text-xl tracking-tighter flex-shrink-0 shadow-lg">
              TMDB
            </div>

            <div className="text-xs sm:text-sm text-gray-400 leading-relaxed text-center sm:text-left">
              <p className="mb-3">
                Este produto utiliza a API do <strong>The Movie Database (TMDB)</strong> para enriquecimento de metadados, títulos, sinopses, capas, backdrops e elenco, mas não é certificado ou endossado pelo TMDB.
              </p>
              <p>
                Todos os dados e imagens associados às obras são de propriedade de seus respectivos criadores e fornecedores de metadados.
              </p>
              <div className="mt-4">
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
                >
                  Visitar themoviedb.org →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Botão Voltar */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-sm font-bold transition-all shadow-xl cursor-pointer"
          >
            ← Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
