"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Tv, Bookmark, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { label: "Início", href: "/", icon: Home },
    { label: "Filmes", href: "/filmes", icon: Film },
    { label: "Séries", href: "/series", icon: Tv },
    { label: "Minha Lista", href: "/minha-lista", icon: Bookmark },
    { label: "Busca", href: "/busca", icon: Search },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0e14]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 flex items-center justify-around safe-bottom">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors",
              isActive ? "text-primary" : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
