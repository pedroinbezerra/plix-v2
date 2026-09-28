"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X, Loader2, Film } from "lucide-react";
import { EnrichedMedia } from "@/providers/metadata/types";
import { MediaCard } from "@/components/media/MediaCard";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EnrichedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search effect (350ms)
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data.results) ? data.results : []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Erro na requisição de busca:", err);
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="pt-20 sm:pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen pb-16">
      {/* Campo de Busca Focável (Compatível com TV e Mobile) */}
      <div className="relative max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 w-6 h-6 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            autoFocus
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise por filmes, séries, animes ou doramas..."
            className="w-full pl-13 pr-12 py-4 rounded-2xl bg-surface-card border border-white/10 text-white placeholder-gray-500 text-base sm:text-lg focus:border-primary focus:bg-surface-light shadow-xl transition-all outline-none"
          />

          {loading ? (
            <div className="absolute right-4 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Limpar pesquisa"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Exibição dos Resultados */}
      {results.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Resultados ({results.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {results.map((item) => (
              <MediaCard
                key={`${item.mediaType}-${item.id}`}
                media={item}
                className="w-full"
              />
            ))}
          </div>
        </div>
      ) : hasSearched && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface/30 rounded-2xl border border-white/5 p-8 max-w-lg mx-auto">
          <Film className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-200 mb-1">
            Nenhum resultado para &quot;{query}&quot;
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            Verifique a ortografia ou tente pesquisar por outro termo, nome em português ou título original.
          </p>
        </div>
      ) : !query ? (
        <div className="text-center py-24 text-gray-500 text-sm">
          Digite o nome de qualquer filme, série, anime ou dorama para buscar.
        </div>
      ) : null}
    </div>
  );
}
