"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tv, AlertCircle, LogOut, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Detecta se o dispositivo é uma Smart TV ou TV Box através de múltiplos sinais:
 * 1. APIs Globais do SO da TV (Tizen, webOS, webOSSystem)
 * 2. Padrões de User-Agent de fabricantes (Samsung, LG, Google TV, Android TV, Fire TV, Hisense, Roku, etc.)
 */
export function checkIsSmartTv(customUa?: string, customWin?: any): boolean {
  if (typeof window === "undefined" && !customUa && !customWin) return false;

  const win = customWin || (typeof window !== "undefined" ? window : null);
  if (win) {
    if (
      typeof win.tizen !== "undefined" ||
      typeof win.webOS !== "undefined" ||
      typeof win.webOSSystem !== "undefined"
    ) {
      return true;
    }
  }

  const ua = (
    customUa || (typeof navigator !== "undefined" ? navigator.userAgent : "")
  ).toLowerCase();

  const tvRegex =
    /smart-tv|smarttv|googletv|google\s?tv|android\s?tv|appletv|hbbtv|pov_tv|netcast|viera|bravia|tizen|web0?s|vidaa|hisense|roku|aft[a-z0-9]|firetv|fire\s?tv|crkey|mibox|mitv|shield|opera\s?tv|vewd|aquos|dtv|philipstv|sonytv|tv\s?bro|puffin/i;

  return tvRegex.test(ua);
}

/**
 * SpatialNavigation & Smart TV Remote Engine
 * Transforma qualquer navegador (Smart TV, Android TV, Tizen, webOS, PC conectado à TV)
 * em uma experiência fluida de streaming operada 100% pelo controle remoto (D-Pad).
 */
export function SpatialNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isTvMode, setIsTvMode] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ title: string; subtitle: string } | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);
  const cancelExitBtnRef = useRef<HTMLButtonElement>(null);
  const confirmExitBtnRef = useRef<HTMLButtonElement>(null);

  // 1. Detecção 100% automática de Smart TVs no carregamento da página
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTvDetected = checkIsSmartTv();
    const savedPreference = localStorage.getItem("plix_tv_mode");

    // Se o dispositivo for uma Smart TV, ativa automaticamente por padrão sem exigir clique!
    if (isTvDetected || savedPreference === "true") {
      enableTvMode(false, isTvDetected);
    }
  }, []);

  const enableTvMode = (notify = true, auto = false) => {
    setIsTvMode(true);
    if (auto) setIsAutoDetected(true);
    localStorage.setItem("plix_tv_mode", "true");
    document.body.classList.add("tv-mode");
    window.dispatchEvent(
      new CustomEvent("plix:tv-mode-changed", {
        detail: { isTvMode: true, isAutoDetected: auto || isAutoDetected },
      })
    );
    if (notify) {
      setToastInfo({
        title: auto ? "Smart TV Detectada Automaticamente" : "Modo Smart TV Ativado",
        subtitle: "Navegação por D-Pad e controle remoto otimizada.",
      });
      setTimeout(() => setToastInfo(null), 3500);
    }
  };

  const disableTvMode = (notify = true) => {
    setIsTvMode(false);
    setIsAutoDetected(false);
    localStorage.setItem("plix_tv_mode", "false");
    document.body.classList.remove("tv-mode");
    document.body.classList.remove("tv-cursor-hide");
    window.dispatchEvent(
      new CustomEvent("plix:tv-mode-changed", {
        detail: { isTvMode: false, isAutoDetected: false },
      })
    );
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
    else enableTvMode(true, false);
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

  // 3. Interceptação de histórico no nível raiz (Home "/") para evitar voltar acidentalmente para login ou fechar sem aviso
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname === "/") {
      // Garante uma entrada no histórico da home para capturar o botão voltar
      try {
        window.history.pushState({ plixRoot: true }, "", "/");
      } catch {
        // Ignora
      }

      const handlePopState = (e: PopStateEvent) => {
        // Se o usuário tentar voltar a partir da raiz, impede a saída direta e exibe o modal
        try {
          window.history.pushState({ plixRoot: true }, "", "/");
        } catch {
          // Ignora
        }
        setIsExitModalOpen(true);
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [pathname]);

  // Foco automático no botão de cancelar quando o modal de confirmação de saída abre
  useEffect(() => {
    if (isExitModalOpen) {
      const timer = setTimeout(() => {
        cancelExitBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExitModalOpen]);

  // Executa o fechamento do app sem deslogar a sessão do usuário
  const handleExitApp = () => {
    setIsExitModalOpen(false);

    try {
      const win = window as any;
      // Samsung Tizen OS
      if (win.tizen?.application?.getCurrentApplication) {
        win.tizen.application.getCurrentApplication().exit();
        return;
      }

      // LG webOS
      if (win.webOS?.platformBack) {
        win.webOS.platformBack();
        return;
      }

      // Android TV / Navegador / PWA
      window.close();
    } catch {
      window.close();
    }
  };

  // 4. Mecanismo de Navegação Espacial Unificado (D-Pad: Cima, Baixo, Esquerda, Direita, OK e Voltar)
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

      // Códigos de tecla Back/Voltar comuns de controles de Smart TV
      const isBackKey =
        key === "Escape" ||
        key === "Backspace" ||
        key === "GoBack" ||
        keyCode === 10009 || // Samsung Tizen Return
        keyCode === 461 ||   // LG webOS Back
        keyCode === 4;       // Android TV Back

      const isArrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
      const isMenuKey = key === "ContextMenu" || key === "Menu" || keyCode === 82;

      // Ativação automática em tempo real se ainda não ativado
      if (!isTvMode && (isArrow || isBackKey || isMenuKey) && !isInput) {
        enableTvMode(true, true);
      }

      // 4.1. Tecla MENU do controle remoto: abre o menu de três pontinhos do título focado
      if (isMenuKey && !isInput) {
        const active = document.activeElement as HTMLElement | null;
        const cardLink = active?.hasAttribute("data-card-link")
          ? active
          : active?.closest('[data-card-wrapper="true"]')?.querySelector<HTMLElement>('a[data-card-link="true"]');
        const mediaId = cardLink?.getAttribute("data-media-id");

        if (mediaId) {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent("plix:open-media-menu", { detail: { id: mediaId } }));
          return;
        }
      }

      // 4.2. Long-press no OK / Enter para abrir o menu de três pontinhos no título
      if ((key === "Enter" || keyCode === 13) && !e.repeat && !isInput && !isExitModalOpen) {
        const active = document.activeElement as HTMLElement | null;
        if (active?.hasAttribute("data-card-link")) {
          const mediaId = active.getAttribute("data-media-id");
          if (mediaId) {
            longPressTriggeredRef.current = false;
            longPressTimerRef.current = setTimeout(() => {
              longPressTriggeredRef.current = true;
              window.dispatchEvent(
                new CustomEvent("plix:open-media-menu", { detail: { id: mediaId } })
              );
            }, 450);
          }
        }
      }

      // 4.3. Tratamento se o Modal de Saída estiver aberto
      if (isExitModalOpen) {
        if (isBackKey) {
          e.preventDefault();
          e.stopPropagation();
          setIsExitModalOpen(false);
          return;
        }

        if (key === "ArrowLeft" || key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          cancelExitBtnRef.current?.focus();
          return;
        }

        if (key === "ArrowRight" || key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          confirmExitBtnRef.current?.focus();
          return;
        }

        return;
      }

      // 4.4. Se um menu contextual de três pontinhos estiver aberto, delegamos a navegação a ele
      const openContextMenu = document.querySelector('[data-media-menu-open="true"]');
      if (openContextMenu) {
        // O listener interno do MediaContextMenu já trata as teclas e o botão voltar
        return;
      }

      // 4.5. Tratamento inteligente da tecla VOLTAR (D-Pad / Controle Remoto)
      if (isBackKey && !isInput) {
        e.preventDefault();
        e.stopPropagation();

        // A) Se houver algum modal aberto com botão fechar, fecha o modal
        const closeBtn = document.querySelector('button[aria-label="Fechar"]') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
          return;
        }

        // B) Se estiver assistindo a um vídeo, sai do player (a menos que esteja ajustando a barra de progresso)
        if (pathname.startsWith("/assistir/")) {
          const scrubbingEl = document.querySelector('[data-player-scrubbing="true"]');
          if (scrubbingEl) {
            // Permite que o StreamingPlayer trate o cancelamento do ajuste de timeline
            return;
          }
          const backBtn = document.querySelector('a[aria-label="Voltar"]') as HTMLElement;
          if (backBtn) backBtn.click();
          else router.back();
          return;
        }

        // C) Se estiver na página de detalhes, volta para o catálogo inicial
        if (pathname.startsWith("/detalhes/")) {
          router.push("/");
          return;
        }

        // D) Se estiver em qualquer outra rota secundária, volta para a home
        if (pathname !== "/" && pathname !== "/login") {
          router.push("/");
          return;
        }

        // E) Se estiver na Home ("/") e pressionar voltar:
        // Exibe o aviso/confirmação antes de sair do app!
        if (pathname === "/") {
          setIsExitModalOpen(true);
          return;
        }
      }

      // 4.6. No player de streaming, a navegação de D-pad, botões e timeline é gerenciada pelo StreamingPlayer
      if (pathname.startsWith("/assistir/")) {
        return;
      }

      // Navegação direcional por setas (D-pad)
      if (!isArrow || isInput) return;

      // Throttle de repetição rápida para evitar pular de 2 em 2 ao segurar botão do controle
      const now = Date.now();
      if (e.repeat && now - lastNavTimeRef.current < 160) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      lastNavTimeRef.current = now;

      const activeEl = document.activeElement as HTMLElement | null;

      // Se nenhum elemento estiver focado, foca o primeiro elemento interativo da tela
      if (!activeEl || activeEl === document.body) {
        e.preventDefault();
        e.stopPropagation();
        const firstFocusable = document.querySelector(
          'a[data-card-link="true"], a[href="/"], button, a[href^="/detalhes/"]'
        ) as HTMLElement;
        if (firstFocusable) firstFocusable.focus();
        return;
      }

      // 4.7. Acesso e navegação para o menu de três pontinhos no título:
      // Se estamos no card principal e o usuário pressiona ArrowDown, foca o botão de opções do card
      if (activeEl.hasAttribute("data-card-link")) {
        const wrapper = activeEl.closest('[data-card-wrapper="true"]');
        const menuBtn = wrapper?.querySelector<HTMLElement>('button[data-menu-trigger="true"]');

        if (key === "ArrowDown" && menuBtn) {
          e.preventDefault();
          e.stopPropagation();
          menuBtn.focus();
          menuBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          return;
        }
      }

      // Se estamos no botão de três pontinhos do card:
      if (activeEl.hasAttribute("data-menu-trigger")) {
        const wrapper = activeEl.closest('[data-card-wrapper="true"]');
        const cardLink = wrapper?.querySelector<HTMLElement>('a[data-card-link="true"]');

        // ArrowUp ou ArrowLeft: retorna ao card principal
        if ((key === "ArrowUp" || key === "ArrowLeft") && cardLink) {
          e.preventDefault();
          e.stopPropagation();
          cardLink.focus();
          cardLink.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          return;
        }

        // ArrowRight: avança para o próximo card da fileira
        if (key === "ArrowRight") {
          const rowContainer = activeEl.closest(".overflow-x-auto");
          if (rowContainer) {
            const allCards = Array.from(
              rowContainer.querySelectorAll<HTMLElement>('a[data-card-link="true"]')
            );
            const currentCard = wrapper?.querySelector<HTMLElement>('a[data-card-link="true"]');
            const currentIndex = currentCard ? allCards.indexOf(currentCard) : -1;

            if (currentIndex !== -1 && currentIndex < allCards.length - 1) {
              e.preventDefault();
              e.stopPropagation();
              allCards[currentIndex + 1].focus();
              allCards[currentIndex + 1].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
              return;
            }
          }
        }
      }

      // 4.8. Navegação horizontal dentro de fileiras de mídia (Carrossel)
      const rowContainer = activeEl.closest(".overflow-x-auto");
      if (rowContainer && (key === "ArrowLeft" || key === "ArrowRight")) {
        const cardsInRow = Array.from(
          rowContainer.querySelectorAll<HTMLElement>(
            'a[data-card-link="true"], a[href^="/detalhes/"], a[href^="/assistir/"]'
          )
        );
        const currentIndex = cardsInRow.indexOf(activeEl);

        if (currentIndex !== -1) {
          let nextCard: HTMLElement | null = null;
          if (key === "ArrowRight" && currentIndex < cardsInRow.length - 1) {
            nextCard = cardsInRow[currentIndex + 1];
          } else if (key === "ArrowLeft" && currentIndex > 0) {
            nextCard = cardsInRow[currentIndex - 1];
          }

          if (nextCard) {
            e.preventDefault();
            e.stopPropagation();
            nextCard.focus();
            nextCard.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
            return;
          }
        }
      }

      // 4.9. Navegação Espacial por Proximidade Geométrica 2D
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex="0"]'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      });

      const currentRect = activeEl.getBoundingClientRect();
      let bestCandidate: HTMLElement | null = null;
      let bestDistance = Infinity;

      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;

      focusables.forEach((el) => {
        if (el === activeEl) return;
        const rect = el.getBoundingClientRect();

        let isCandidate = false;
        let distance = Infinity;

        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;

        const dx = ex - cx;
        const dy = ey - cy;

        if (key === "ArrowRight" && dx > 15) {
          isCandidate = true;
          distance = dx * 1.0 + Math.abs(dy) * 2.0;
        } else if (key === "ArrowLeft" && dx < -15) {
          isCandidate = true;
          distance = Math.abs(dx) * 1.0 + Math.abs(dy) * 2.0;
        } else if (key === "ArrowDown" && dy > 15) {
          isCandidate = true;
          distance = dy * 1.0 + Math.abs(dx) * 1.5;
        } else if (key === "ArrowUp" && dy < -15) {
          isCandidate = true;
          distance = Math.abs(dy) * 1.0 + Math.abs(dx) * 1.5;
        }

        if (isCandidate && distance < bestDistance) {
          bestDistance = distance;
          bestCandidate = el;
        }
      });

      if (bestCandidate) {
        e.preventDefault();
        e.stopPropagation();
        (bestCandidate as HTMLElement).focus();
        (bestCandidate as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    },
    [pathname, router, isTvMode, isExitModalOpen]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (longPressTriggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
        longPressTriggeredRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp]);

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

      {/* Modal de Confirmação de Saída do Aplicativo (Estilo Apple TV Glass) */}
      {isExitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-[#161722]/95 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center text-white">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-primary shadow-inner">
              <LogOut className="w-7 h-7 text-primary" />
            </div>

            <h3 id="exit-title" className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
              Sair do Plix?
            </h3>

            <p className="text-sm text-gray-300 mb-7 leading-relaxed">
              Você está prestes a sair do aplicativo. Deseja realmente sair? Sua sessão continuará salva para quando retornar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botão de Cancelar / Continuar no Plix (Focado por padrão) */}
              <button
                ref={cancelExitBtnRef}
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="flex-1 py-3.5 px-5 rounded-2xl font-semibold text-sm bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Continuar no Plix</span>
              </button>

              {/* Botão de Sair do Aplicativo */}
              <button
                ref={confirmExitBtnRef}
                type="button"
                onClick={handleExitApp}
                className="py-3.5 px-5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/15 active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400/50 cursor-pointer text-gray-300"
              >
                Sair do aplicativo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
