"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    // Atualiza automaticamente quando a janela ou aba volta a ter foco
    const handleFocus = () => {
      router.refresh();
    };

    // Trata bfcache e navegação por botão Voltar do navegador
    const handlePageShow = (e: PageTransitionEvent) => {
      router.refresh();
    };

    // Trata alternância de abas em navegadores de TV e mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    // Evento disparado internamente quando reprodução inicia ou watchlist é alterada
    const handleDataUpdated = () => {
      router.refresh();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("plix:data-updated", handleDataUpdated);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("plix:data-updated", handleDataUpdated);
    };
  }, [router]);

  return null;
}
