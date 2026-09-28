"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tv, Monitor, ArrowLeft } from "lucide-react";

/**
 * SpatialNavigation & Smart TV Remote Engine
 * Transforma qualquer navegador (Smart TV, Android TV, Tizen, webOS, PC conectado à TV)
 * em uma experiência fluida de streaming operada 100% pelo controle remoto (D-Pad).
 */
export function SpatialNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isTvMode, setIsTvMode] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ title: string; subtitle: string } | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Detecção automática de navegadores de Smart TV
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isTvDetected =
      /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast.tv|viera|bravia|tizen|webos|android.*tv|crkey/.test(
        ua
      );

    const savedPreference = localStorage.getItem("plix_tv_mode");
    if (savedPreference === "true" || (savedPreference === null && isTvDetected)) {
      enableTvMode(false);
    }
  }, []);

  const enableTvMode = (notify = true) => {
    setIsTvMode(true);
    localStorage.setItem("plix_tv_mode", "true");
    document.body.classList.add("tv-mode");
    window.dispatchEvent(new CustomEvent("plix:tv-mode-changed", { detail: { isTvMode: true } }));
    if (notify) {
      setToastInfo({
        title: "Modo Smart TV Ativado",
        subtitle: "Navegação por D-Pad e controle remoto otimizada.",
      });
      setTimeout(() => setToastInfo(null), 3000);
    }
  };

  const disableTvMode = (notify = true) => {
    setIsTvMode(false);
    localStorage.setItem("plix_tv_mode", "false");
    document.body.classList.remove("tv-mode");
    document.body.classList.remove("tv-cursor-hide");
    window.dispatchEvent(new CustomEvent("plix:tv-mode-changed", { detail: { isTvMode: false } }));
    if (notify) {
      setToastInfo({
        title: "Modo Smart TV Desativado",
        subtitle: "Retornado à interface padrão de mouse e toque.",
      });
      setTimeout(() => setToastInfo(null), 3000);
    }
  };

  const toggleTvMode = () => {
    if (isTvMode) disableTvMode(true);
    else enableTvMode(true);
  };

  // Listener para eventos customizados disparados por outros componentes (ex: Navbar)
  useEffect(() => {
    const handleToggle = () => toggleTvMode();
    window.addEventListener("plix:toggle-tv-mode", handleToggle);
    return () => window.removeEventListener("plix:toggle-tv-mode", handleToggle);
  }, [isTvMode]);

  // 2. Ocultação automática de cursor na TV quando inativo
  useEffect(() => {
    if (!isTvMode || typeof window === "undefined") return;

    const handleMouseMove = () => {
      document.body.classList.remove("tv-cursor-hide");
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      idleTimerRef.current = setTimeout(() => {
        document.body.classList.add("tv-cursor-hide");
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isTvMode]);

  // 3. Mecanismo de Navegação Espacial (D-Pad: Cima, Baixo, Esquerda, Direita, OK e Voltar)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key, keyCode } = e;

      // Atalho de teclado para alternar Modo TV: Tecla 'T' ou 'F8' (quando não estiver digitando)
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if ((key === "t" || key === "T") && !isInput && e.altKey) {
        e.preventDefault();
        toggleTvMode();
        return;
      }

      // Códigos comuns de controle remoto de TV (Samsung Tizen, LG webOS, Android TV)
      const isBackKey =
        key === "Escape" ||
        key === "Backspace" ||
        key === "GoBack" ||
        keyCode === 10009 || // Tizen Return
        keyCode === 461 ||   // webOS Back
        keyCode === 4;       // Android TV Back

      // Tratamento especial da tecla VOLTAR do controle da TV
      if (isBackKey && !isInput) {
        // Se houver modal aberto com botão fechar, fecha o modal primeiro
        const closeBtn = document.querySelector('button[aria-label="Fechar"]') as HTMLElement;
        if (closeBtn) {
          e.preventDefault();
          closeBtn.click();
          return;
        }

        // Se estiver no player ou detalhes, volta suavemente sem sair do app/navegador
        if (pathname.startsWith("/assistir/")) {
          e.preventDefault();
          const backBtn = document.querySelector('a[aria-label="Voltar"]') as HTMLElement;
          if (backBtn) backBtn.click();
          else router.back();
          return;
        }

        if (pathname.startsWith("/detalhes/")) {
          e.preventDefault();
          router.push("/");
          return;
        }

        if (pathname !== "/") {
          e.preventDefault();
          router.push("/");
          return;
        }
      }

      // Navegação por setas (D-pad)
      const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
      if (!isArrow || isInput) return;

      const activeEl = document.activeElement as HTMLElement | null;

      // Se nenhum elemento estiver focado, foca o primeiro elemento interativo da tela
      if (!activeEl || activeEl === document.body) {
        e.preventDefault();
        const firstFocusable = document.querySelector(
          'a[href="/"], button, a[href^="/detalhes/"]'
        ) as HTMLElement;
        if (firstFocusable) firstFocusable.focus();
        return;
      }

      // Localiza todos os elementos focáveis visíveis no momento
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex="0"]'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      });

      const currentRect = activeEl.getBoundingClientRect();
      let nextElement: HTMLElement | null = null;

      // 3.1. Navegação horizontal dentro de fileiras de mídia (Carrossel)
      const rowContainer = activeEl.closest(".overflow-x-auto");
      if (rowContainer && (key === "ArrowLeft" || key === "ArrowRight")) {
        const cardsInRow = Array.from(
          rowContainer.querySelectorAll<HTMLElement>('a[href^="/detalhes/"]')
        );
        const currentIndex = cardsInRow.indexOf(activeEl);

        if (currentIndex !== -1) {
          if (key === "ArrowRight" && currentIndex < cardsInRow.length - 1) {
            nextElement = cardsInRow[currentIndex + 1];
          } else if (key === "ArrowLeft" && currentIndex > 0) {
            nextElement = cardsInRow[currentIndex - 1];
          }
        }
      }

      // 3.2. Se não foi resolvido horizontalmente, usa cálculo de proximidade espacial (Geometria 2D)
      if (!nextElement) {
        let bestDistance = Infinity;

        focusables.forEach((el) => {
          if (el === activeEl) return;
          const rect = el.getBoundingClientRect();

          let isCandidate = false;
          let distance = Infinity;

          const cx = currentRect.left + currentRect.width / 2;
          const cy = currentRect.top + currentRect.height / 2;
          const ex = rect.left + rect.width / 2;
          const ey = rect.top + rect.height / 2;

          const dx = ex - cx;
          const dy = ey - cy;

          if (key === "ArrowRight" && dx > 15) {
            isCandidate = true;
            distance = dx * 1.0 + Math.abs(dy) * 2.0; // Pondera desvio vertical
          } else if (key === "ArrowLeft" && dx < -15) {
            isCandidate = true;
            distance = Math.abs(dx) * 1.0 + Math.abs(dy) * 2.0;
          } else if (key === "ArrowDown" && dy > 15) {
            isCandidate = true;
            distance = dy * 1.0 + Math.abs(dx) * 1.5; // Pondera desvio horizontal
          } else if (key === "ArrowUp" && dy < -15) {
            isCandidate = true;
            distance = Math.abs(dy) * 1.0 + Math.abs(dx) * 1.5;
          }

          if (isCandidate && distance < bestDistance) {
            bestDistance = distance;
            nextElement = el;
          }
        });
      }

      if (nextElement) {
        e.preventDefault();
        (nextElement as HTMLElement).focus();

        // Rola suavemente para manter o item focado no centro da tela da TV
        (nextElement as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    },
    [pathname, router, isTvMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Toast informativo ao alternar Modo TV */}
      {toastInfo && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/95 border border-primary text-white shadow-2xl backdrop-blur-xl animate-fade-in text-xs font-semibold">
          <Tv className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <p className="font-bold">{toastInfo.title}</p>
            <p className="text-gray-300 text-[11px]">{toastInfo.subtitle}</p>
          </div>
        </div>
      )}
    </>
  );
}
