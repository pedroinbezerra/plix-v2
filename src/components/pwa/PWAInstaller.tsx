"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Registra o Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Falha ao registrar Service Worker:", err);
        });
    }

    // 2. Verifica se já está instalado / executando como standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Detecta iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 4. Captura o evento de instalação do Chrome / Android / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Não exibe se o usuário dispensou nas últimas 24h
      const dismissedUntil = localStorage.getItem("plix_pwa_dismissed_until");
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }

      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detecta instalação concluída
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Guarda recusa por 24 horas
    localStorage.setItem("plix_pwa_dismissed_until", String(Date.now() + 24 * 60 * 60 * 1000));
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Instalação do Aplicativo Plix"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-surface/95 border border-primary/30 shadow-2xl backdrop-blur-xl animate-fade-in text-white flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Instalar o Plix</h3>
            <p className="text-xs text-gray-300">
              Instale no celular para abrir em tela cheia e ter acesso rápido como um app nativo.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dispensar aviso de instalação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <div className="text-[11px] bg-white/5 border border-white/10 rounded-xl p-2.5 text-gray-300">
          No iPhone/iPad: toque em <strong>Compartilhar</strong> (ícone do quadrado com seta) e depois em <strong>Adicionar à Tela de Início</strong>.
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Depois
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-primary/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar Agora</span>
          </button>
        </div>
      )}
    </aside>
  );
}
