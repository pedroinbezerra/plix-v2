"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Search, LogOut, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { ProfileModal } from "@/components/profile/ProfileModal";

interface ProfileItem {
  id: string;
  name: string;
  avatar: string;
}

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    username: string;
    role?: string;
    profiles?: ProfileItem[];
  } | null;
  profile?: ProfileItem | null;
}

export function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ProfileItem | null>(profile || null);
  const [isTvMode, setIsTvMode] = useState(false);
  const [isAutoDetectedTv, setIsAutoDetectedTv] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTvMode(
        localStorage.getItem("plix_tv_mode") === "true" ||
          document.body.classList.contains("tv-mode")
      );

      const handleTvChange = (e: Event) => {
        const customEvent = e as CustomEvent<{ isTvMode: boolean; isAutoDetected?: boolean }>;
        if (customEvent.detail) {
          setIsTvMode(customEvent.detail.isTvMode);
          if (customEvent.detail.isAutoDetected) {
            setIsAutoDetectedTv(true);
          }
        } else {
          setIsTvMode(document.body.classList.contains("tv-mode"));
        }
      };

      window.addEventListener("plix:tv-mode-changed", handleTvChange);
      return () => window.removeEventListener("plix:tv-mode-changed", handleTvChange);
    }
  }, []);

  const handleToggleTv = () => {
    window.dispatchEvent(new CustomEvent("plix:toggle-tv-mode"));
  };

  useEffect(() => {
    if (profile) {
      setActiveProfile(profile);
    }
  }, [profile]);

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
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/40 border-b border-white/5"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        )}
      >
        {/* Esquerda: Logo + Links */}
        <div className="flex items-center gap-6 sm:gap-10">
          <Link
            href="/"
            onClick={() => router.refresh()}
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
                  onClick={() => {
                    if (link.href === "/") {
                      router.refresh();
                    }
                  }}
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

        {/* Direita: Modo TV + Busca + Perfil + Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Botão Alternar Modo Smart TV */}
          <button
            onClick={handleToggleTv}
            aria-label={isTvMode ? "Desativar Modo TV" : "Ativar Modo TV"}
            title={
              isTvMode
                ? isAutoDetectedTv
                  ? "Modo Smart TV Ativo (Detectado Automaticamente)"
                  : "Modo Smart TV Ativo (Clique para desativar)"
                : "Ativar Modo Smart TV (D-pad & Controle Remoto)"
            }
            className={cn(
              "p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer relative",
              isTvMode
                ? "bg-primary text-white shadow-md shadow-primary/40 ring-2 ring-primary/40"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            )}
          >
            <Tv className="w-5 h-5" />
            {isTvMode && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse"
                title="Ativo"
              />
            )}
          </button>

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

          {/* Botão de Perfil Interativo (Abre Modal de Gerenciamento) */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 py-1 px-1.5 sm:px-3 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-gray-200 transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Gerenciar perfil e trocar foto"
            title="Clique para editar nome, trocar foto ou trocar de perfil"
          >
            <AvatarDisplay
              avatar={activeProfile?.avatar}
              name={activeProfile?.name}
              size="sm"
            />
            <span className="hidden sm:inline font-semibold max-w-[130px] truncate">
              {activeProfile?.name || user?.name || "Perfil"}
            </span>
          </button>

          {/* Botão de Logout Rápido */}
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

      {/* Modal de Gerenciamento de Perfil */}
      {user && activeProfile && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={{
            name: user.name,
            username: user.username,
            role: user.role,
          }}
          currentProfile={activeProfile}
          profiles={user.profiles || [activeProfile]}
          onProfileUpdated={(updated) => {
            setActiveProfile(updated);
          }}
        />
      )}
    </>
  );
}
