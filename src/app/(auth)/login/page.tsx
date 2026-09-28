"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Usuário ou senha inválidos");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão com o servidor");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#090a0f] via-[#0f111a] to-[#090a0f] p-4 sm:p-6">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Film className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-wider text-white">
              PLIX
            </span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Seu streaming pessoal de filmes, séries, animes e doramas
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Usuário
            </label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário (ex: admin)"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-surface-light/80 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:bg-surface-light transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              className="w-full px-4 py-3.5 rounded-xl bg-surface-light/80 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:bg-surface-light transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold tracking-wide transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-400">
          Homelab Streaming • Controle total e privacidade local
        </div>
      </div>
    </div>
  );
}
