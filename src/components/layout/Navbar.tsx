"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Search, Bookmark, History, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    name: string;
    username: string;
  } | null;
  profile?: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

export function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  const navLinks = [
    { label: "Início", href: "/" },
    { label: "Filmes", href: "/filmes" },
    { label: "Séries", href: "/series" },
    { label: "Animes", href: "/animes" },
    { label: "Doramas", href: "/doramas" },
    { label: "Minha Lista", href: "/minha-lista" },
    { label: "Histórico", href: "/historico" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/40 border-b border-white/5"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      )}
    >
      {/* Esquerda: Logo + Links */}
      <div className="flex items-center gap-6 sm:gap-10">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-wider text-white">
            PLIX
          </span>
        </Link>

        {/* Links de navegação */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:text-white",
                  isActive
                    ? "text-white bg-white/10 font-semibold"
                    : "text-gray-300 hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Direita: Busca + Perfil + Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Link para Busca */}
        <Link
          href="/busca"
          aria-label="Pesquisar"
          className={cn(
            "p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center",
            pathname === "/busca" && "bg-white/15 text-white"
          )}
        >
          <Search className="w-5 h-5" />
        </Link>

        {/* Informação do perfil */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
          <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center text-white text-[10px] font-bold">
            {profile?.name?.charAt(0) || user?.name?.charAt(0) || "P"}
          </div>
          <span className="font-medium max-w-[120px] truncate">
            {profile?.name || user?.name || "Usuário"}
          </span>
        </div>

        {/* Botão de Logout */}
        <button
          onClick={handleLogout}
          aria-label="Sair da conta"
          title="Encerrar sessão"
          className="p-2.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
