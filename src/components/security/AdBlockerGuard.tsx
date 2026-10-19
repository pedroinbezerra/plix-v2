"use client";

import { useEffect, useState } from "react";

export const POPUP_BLOCKER_KEY = "plix_popup_blocker";

export function isPopupBlockerEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(POPUP_BLOCKER_KEY);
    return saved !== "false";
  } catch {
    return true;
  }
}

/**
 * AdBlockerGuard
 * Proteção configurável contra anúncios abusivos, bloqueando por padrão
 * a abertura involuntária de novas abas, popups e popunders no Plix.
 * Pode ser ativado ou desativado pelo usuário nas configurações de Perfil.
 */
export function AdBlockerGuard() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setEnabled(isPopupBlockerEnabled());

    const handlePreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setEnabled(customEvent.detail.enabled);
      } else {
        setEnabled(isPopupBlockerEnabled());
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === POPUP_BLOCKER_KEY) {
        setEnabled(event.newValue !== "false");
      }
    };

    window.addEventListener("plix:popup-blocker-changed", handlePreferenceChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("plix:popup-blocker-changed", handlePreferenceChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    // 1. Intercepta window.open para impedir popups e abas automáticas
    const originalOpen = window.open;
    window.open = function (
      url?: string | URL,
      target?: string,
      features?: string
    ): Window | null {
      // Se for intencionalmente na mesma janela (_self), permite
      if (target === "_self") {
        return originalOpen.call(window, url, target, features);
      }

      console.warn(
        "[Plix AdBlock] Abertura de nova aba/janela bloqueada com sucesso:",
        url
      );
      return null;
    };

    // 2. Intercepta cliques com target="_blank" abusivos no DOM da aplicação
    const handleCaptureClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      const targetAttr = target.getAttribute("target");

      // Permite apenas links institucionais e documentação explicitamente autorizados
      const isWhitelisted =
        href.startsWith("/") ||
        href.startsWith("#") ||
        href.includes("github.com") ||
        href.includes("themoviedb.org");

      if (targetAttr === "_blank" && !isWhitelisted) {
        event.preventDefault();
        event.stopPropagation();
        console.warn(
          "[Plix AdBlock] Clique com target=_blank não autorizado interceptado:",
          href
        );
      }
    };

    // Captura antes de qualquer listener filho
    document.addEventListener("click", handleCaptureClick, true);
    document.addEventListener("auxclick", handleCaptureClick, true);

    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", handleCaptureClick, true);
      document.removeEventListener("auxclick", handleCaptureClick, true);
    };
  }, [enabled]);

  return null;
}

