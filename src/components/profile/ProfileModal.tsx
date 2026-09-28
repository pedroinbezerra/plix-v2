"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Edit3, Plus, LogOut, User as UserIcon, Shield } from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { AvatarDisplay } from "@/components/ui/AvatarDisplay";
import { cn } from "@/lib/utils";

interface ProfileItem {
  id: string;
  name: string;
  avatar: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    role?: string;
  };
  currentProfile: ProfileItem;
  profiles: ProfileItem[];
  onProfileUpdated?: (updated: ProfileItem) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  currentProfile,
  profiles,
  onProfileUpdated,
}: ProfileModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"view" | "edit" | "new">("view");
  const [name, setName] = useState(currentProfile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile.avatar || "avatar-1");
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    currentProfile.avatar?.startsWith("http") ? currentProfile.avatar : ""
  );
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("avatar-2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const finalAvatar = customAvatarUrl.trim() || selectedAvatar;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar: finalAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar alterações");
        setSaving(false);
        return;
      }

      if (onProfileUpdated && data.profile) {
        onProfileUpdated(data.profile);
      }

      router.refresh();
      setActiveTab("view");
    } catch {
      setError("Erro de comunicação com o servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProfileName.trim(),
          avatar: newProfileAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar perfil");
        setSaving(false);
        return;
      }

      router.refresh();
      window.location.reload();
    } catch {
      setError("Erro ao criar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === currentProfile.id) return;
    setSaving(true);

    try {
      const res = await fetch("/api/user/profile/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });

      if (res.ok) {
        onClose();
        router.refresh();
        window.location.reload();
      }
    } catch (e) {
      console.error("Erro ao trocar de perfil:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Gerenciar Perfil</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto plix-scrollbar space-y-6">
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          {activeTab === "view" && (
            <>
              {/* Card do Perfil Atual */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-card border border-white/10">
                <div className="flex items-center gap-4">
                  <AvatarDisplay
                    avatar={currentProfile.avatar}
                    name={currentProfile.name}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-white">
                      {currentProfile.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>Conta: <strong>{user.username}</strong></span>
                      {user.role === "ADMIN" && (
                        <span className="flex items-center gap-0.5 text-primary text-[10px] uppercase font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setName(currentProfile.name);
                    setSelectedAvatar(currentProfile.avatar || "avatar-1");
                    setActiveTab("edit");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>

              {/* Lista de Outros Perfis */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Trocar de Perfil
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {profiles.map((p) => {
                    const isCurrent = p.id === currentProfile.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSwitchProfile(p.id)}
                        disabled={saving}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                          isCurrent
                            ? "bg-primary/15 border-primary text-white shadow-md shadow-primary/20"
                            : "bg-surface-light/60 border-white/5 text-gray-300 hover:bg-surface-hover hover:text-white"
                        )}
                      >
                        <AvatarDisplay avatar={p.avatar} name={p.name} size="sm" />
                        <span className="text-sm font-semibold truncate flex-1">
                          {p.name}
                        </span>
                        {isCurrent && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}

                  {profiles.length < 5 && (
                    <button
                      onClick={() => setActiveTab("new")}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Perfil</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "edit" && (
            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Nome do Perfil
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do seu perfil"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-surface-light border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                  Escolha um Avatar
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatar === preset.id && !customAvatarUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(preset.id);
                          setCustomAvatarUrl("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border cursor-pointer",
                          isSelected
                            ? "bg-white/15 border-white ring-2 ring-primary scale-105"
                            : "bg-surface-light/40 border-white/5 hover:bg-surface-hover"
                        )}
                      >
                        <AvatarDisplay avatar={preset.id} size="md" />
                        <span className="text-[10px] text-gray-300 truncate max-w-full">
                          {preset.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Ou URL de Imagem Personalizada (Opcional)
                </label>
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-light border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("view")}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "new" && (
            <form onSubmit={handleCreateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Nome do Novo Perfil
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Ex: Família, Crianças, Quarto"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-surface-light border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
                  Avatar do Perfil
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = newProfileAvatar === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setNewProfileAvatar(preset.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border cursor-pointer",
                          isSelected
                            ? "bg-white/15 border-white ring-2 ring-primary scale-105"
                            : "bg-surface-light/40 border-white/5 hover:bg-surface-hover"
                        )}
                      >
                        <AvatarDisplay avatar={preset.id} size="md" />
                        <span className="text-[10px] text-gray-300 truncate max-w-full">
                          {preset.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("view")}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Criando..." : "Criar Perfil"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer com Ação de Logout */}
        <div className="p-4 bg-surface-card border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-500">Plix • Streaming Local</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
}
