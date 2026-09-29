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
    { label: "Desenhos", href: "/desenhos" },
    { label: "Doramas", href: "/doramas" },
    { label: "Minha Lista", href: "/minha-lista" },
    { label: "Histórico", href: "/historico" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Fundo degradê semi-transparente fixo estilo fade */}
        <div className="absolute inset-0 -bottom-6 bg-gradient-to-b from-[#07080a]/95 via-[#07080a]/60 to-transparent pointer-events-none" />

        {/* Esquerda: Logo Apple-like + Links em Pílula */}
        <div className="relative z-10 flex items-center gap-6 sm:gap-10">
          <Link
            href="/"
            onClick={() => router.refresh()}
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <Film className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white">
              PLIX
            </span>
          </Link>

          {/* Links de navegação em cápsulas Apple Glass */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
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
                    "px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all",
                    isActive
                      ? "text-white bg-white/15 backdrop-blur-xl border border-white/15 font-semibold shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/[0.08] border border-transparent"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Direita: Modo TV + Busca + Perfil + Logout */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
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
              "p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer relative backdrop-blur-xl border",
              isTvMode
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                : "bg-white/[0.06] hover:bg-white/[0.14] border-white/10 text-white/80 hover:text-white"
            )}
          >
            <Tv className="w-4.5 h-4.5" />
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
              "p-2.5 rounded-full backdrop-blur-xl border border-white/10 transition-all flex items-center justify-center",
              pathname === "/busca"
                ? "bg-white text-black border-white shadow-md"
                : "bg-white/[0.06] hover:bg-white/[0.14] text-white/80 hover:text-white"
            )}
          >
            <Search className="w-4.5 h-4.5" />
          </Link>

          {/* Botão de Perfil Interativo em Pílula Translúcida */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 py-1 px-1.5 sm:px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 text-xs text-white backdrop-blur-xl transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Gerenciar perfil e trocar foto"
            title="Clique para editar nome, trocar foto ou trocar de perfil"
          >
            <AvatarDisplay
              avatar={activeProfile?.avatar}
              name={activeProfile?.name}
              size="sm"
            />
            <span className="hidden sm:inline font-semibold max-w-[130px] truncate text-white/90">
              {activeProfile?.name || user?.name || "Perfil"}
            </span>
          </button>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            aria-label="Sair da conta"
            title="Encerrar sessão"
            className="p-2.5 rounded-full text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
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
