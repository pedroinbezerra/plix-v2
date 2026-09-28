"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook global de navegação por controle remoto / teclado (D-Pad).
 * Trata ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter e Escape/Back.
 */
export function useSpatialNavigation() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;

      // Se o usuário está digitando em um input de texto ou textarea, não interceptamos setas normais
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
      ) {
        if (e.key === "Escape") {
          activeEl.blur();
          e.preventDefault();
        }
        return;
      }

      // Tecla Back / Escape / Backspace para voltar de telas de detalhes ou player
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "BrowserBack") {
        // Se estamos em página secundária, voltar
        if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
          e.preventDefault();
          router.back();
          return;
        }
      }

      // Navegação por setas (Spatial navigation)
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'
          )
        ).filter(
          (el) =>
            el.offsetParent !== null &&
            window.getComputedStyle(el).visibility !== "hidden" &&
            window.getComputedStyle(el).display !== "none"
        );

        if (!activeEl || !focusable.includes(activeEl)) {
          // Se nada estiver focado, foca o primeiro elemento visível
          if (focusable.length > 0) {
            focusable[0].focus();
            e.preventDefault();
          }
          return;
        }

        const currentRect = activeEl.getBoundingClientRect();
        let bestCandidate: HTMLElement | null = null;
        let minDistance = Infinity;

        for (const candidate of focusable) {
          if (candidate === activeEl) continue;
          const rect = candidate.getBoundingClientRect();

          let isMatch = false;
          let dist = 0;

          if (e.key === "ArrowRight") {
            if (rect.left >= currentRect.right - 10) {
              isMatch = true;
              dist = Math.hypot(rect.left - currentRect.right, rect.top - currentRect.top);
            }
          } else if (e.key === "ArrowLeft") {
            if (rect.right <= currentRect.left + 10) {
              isMatch = true;
              dist = Math.hypot(currentRect.left - rect.right, rect.top - currentRect.top);
            }
          } else if (e.key === "ArrowDown") {
            if (rect.top >= currentRect.bottom - 10) {
              isMatch = true;
              dist = Math.hypot(rect.left - currentRect.left, rect.top - currentRect.bottom);
            }
          } else if (e.key === "ArrowUp") {
            if (rect.bottom <= currentRect.top + 10) {
              isMatch = true;
              dist = Math.hypot(rect.left - currentRect.left, currentRect.top - rect.bottom);
            }
          }

          if (isMatch && dist < minDistance) {
            minDistance = dist;
            bestCandidate = candidate;
          }
        }

        if (bestCandidate) {
          e.preventDefault();
          bestCandidate.focus();
          bestCandidate.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
