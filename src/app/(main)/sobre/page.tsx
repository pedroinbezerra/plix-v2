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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-xl shadow-primary/30 mb-4">
          <Film className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
          PLIX
        </h1>
        <p className="text-base sm:text-lg text-gray-400">
          Plataforma Pessoal & Homelab de Streaming
        </p>
      </div>

      <div className="space-y-8 text-gray-300">
        {/* Seção Sobre o Projeto */}
        <section className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-white/10 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <span>Sobre o Sistema</span>
          </h2>
          <p className="leading-relaxed mb-4 text-sm sm:text-base">
            O <strong>Plix</strong> foi concebido para fornecer uma experiência fluida, limpa e moderna para consumo pessoal de filmes, séries, animes e doramas na rede local doméstica.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-surface-light/60 border border-white/5">
              <Tv className="w-6 h-6 text-blue-400 mb-2" />
              <h3 className="font-semibold text-white text-sm mb-1">Smart TV & D-Pad</h3>
              <p className="text-xs text-gray-400">
                Navegação espacial otimizada para controle remoto sem mouse.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-light/60 border border-white/5">
              <Smartphone className="w-6 h-6 text-emerald-400 mb-2" />
              <h3 className="font-semibold text-white text-sm mb-1">Mobile First</h3>
              <p className="text-xs text-gray-400">
                Interface tátil de alta velocidade com navegação inferior.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-light/60 border border-white/5">
              <Laptop className="w-6 h-6 text-amber-400 mb-2" />
              <h3 className="font-semibold text-white text-sm mb-1">Desktop & Tablets</h3>
              <p className="text-xs text-gray-400">
                Layout expansivo com controles de rolagem lateral e atalhos.
              </p>
            </div>
          </div>
        </section>

        {/* Atribuição Obrigatória do TMDB */}
        <section className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-white/10 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Atribuição de Dados — The Movie Database (TMDB)</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* TMDB Badge visual */}
            <div className="w-32 h-14 bg-gradient-to-r from-[#01b4e4] to-[#90cea1] rounded-xl flex items-center justify-center font-black text-slate-900 text-xl tracking-tighter flex-shrink-0 shadow-lg">
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
                  className="text-xs font-semibold text-blue-400 hover:underline"
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-light hover:bg-surface-hover text-white text-sm font-semibold transition-all border border-white/10"
          >
            ← Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
