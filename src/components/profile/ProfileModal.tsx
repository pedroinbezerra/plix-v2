"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Check,
  Edit3,
  Plus,
  LogOut,
  User as UserIcon,
  Shield,
  Mail,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { GRAVATAR_STYLES, buildGravatarUrl, isGravatarUrl } from "@/lib/gravatar";
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

  // Estado da aba Editar
  const [name, setName] = useState(currentProfile.name);
  const [avatarMode, setAvatarMode] = useState<"preset" | "gravatar" | "url">(
    isGravatarUrl(currentProfile.avatar)
      ? "gravatar"
      : currentProfile.avatar?.startsWith("http")
      ? "url"
      : "preset"
  );
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile.avatar || "avatar-1");
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    currentProfile.avatar?.startsWith("http") ? currentProfile.avatar : ""
  );

  // Estado Gravatar
  const [gravatarEmail, setGravatarEmail] = useState("");
  const [gravatarStyle, setGravatarStyle] = useState("identicon");
  const [gravatarLoading, setGravatarLoading] = useState(false);
  const [gravatarStatus, setGravatarStatus] = useState<{
    hasCustomPhoto?: boolean;
    tested?: boolean;
    previewUrl?: string;
  }>({});

  // Estado da aba Novo Perfil
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("avatar-2");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza dados quando o modal abre ou perfil muda
  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name);
      const isGravatar = isGravatarUrl(currentProfile.avatar);
      const isHttp = currentProfile.avatar?.startsWith("http");

      if (isGravatar) {
        setAvatarMode("gravatar");
        setCustomAvatarUrl(currentProfile.avatar);
      } else if (isHttp) {
        setAvatarMode("url");
        setCustomAvatarUrl(currentProfile.avatar);
      } else {
        setAvatarMode("preset");
        setSelectedAvatar(currentProfile.avatar || "avatar-1");
      }
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  // Busca e aplica Gravatar
  const handleFetchGravatar = async (emailToFetch?: string, styleToUse?: string) => {
    const targetEmail = (emailToFetch || gravatarEmail).trim().toLowerCase();
    const targetStyle = styleToUse || gravatarStyle;

    if (!targetEmail || !targetEmail.includes("@")) {
      setError("Informe um e-mail válido para integrar com o Gravatar");
      return;
    }

    setError(null);
    setGravatarLoading(true);

    try {
      const res = await fetch(
        `/api/user/profile/gravatar?email=${encodeURIComponent(targetEmail)}&style=${encodeURIComponent(targetStyle)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao consultar Gravatar");
        return;
      }

      setGravatarStatus({
        hasCustomPhoto: data.hasCustomPhoto,
        tested: true,
        previewUrl: data.url,
      });

      // Aplica imediatamente como URL do avatar
      setCustomAvatarUrl(data.url);
    } catch {
      setError("Erro ao se conectar ao serviço Gravatar");
    } finally {
      setGravatarLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    let finalAvatar = selectedAvatar;
    if (avatarMode === "gravatar" || avatarMode === "url") {
      finalAvatar = customAvatarUrl.trim() || selectedAvatar;
    }

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

      window.dispatchEvent(new CustomEvent("plix:data-updated"));
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

      window.dispatchEvent(new CustomEvent("plix:data-updated"));
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
        window.dispatchEvent(new CustomEvent("plix:data-updated"));
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

  const isCurrentGravatar = isGravatarUrl(currentProfile.avatar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#101216]/95 border border-white/15 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Gerenciar Perfil</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/60 hover:text-white bg-white/5 hover:bg-white/15 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto plix-scrollbar space-y-6">
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-400">
              {error}
            </div>
          )}

          {activeTab === "view" && (
            <>
              {/* Card do Perfil Atual */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
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
                        <span className="flex items-center gap-0.5 text-white text-[10px] uppercase font-bold bg-white/15 border border-white/20 px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3 text-white" />
                          Admin
                        </span>
                      )}
                    </div>
                    {isCurrentGravatar && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-blue-300 bg-blue-500/15 border border-blue-400/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Gravatar Integrado
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setName(currentProfile.name);
                    setActiveTab("edit");
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/15 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
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
                          "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                          isCurrent
                            ? "bg-white text-black border-white shadow-xl shadow-white/10 font-bold"
                            : "bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08] hover:text-white hover:border-white/20"
                        )}
                      >
                        <AvatarDisplay avatar={p.avatar} name={p.name} size="sm" />
                        <span className={cn("text-sm truncate flex-1", isCurrent ? "font-bold text-black" : "font-semibold")}>
                          {p.name}
                        </span>
                        {isCurrent && <Check className="w-4 h-4 text-black flex-shrink-0" />}
                      </button>
                    );
                  })}

                  {profiles.length < 5 && (
                    <button
                      onClick={() => setActiveTab("new")}
                      className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
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
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/15 text-white placeholder-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white text-sm transition-all"
                />
              </div>

              {/* Seletor de Tipo de Avatar */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Origem do Avatar
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.06] rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={() => setAvatarMode("preset")}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      avatarMode === "preset"
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>8 Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode("gravatar")}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      avatarMode === "gravatar"
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Gravatar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode("url")}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      avatarMode === "url"
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>URL Web</span>
                  </button>
                </div>
              </div>

              {/* Modo: Presets Plix */}
              {avatarMode === "preset" && (
                <div>
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
                            "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all border cursor-pointer",
                            isSelected
                              ? "bg-white/15 border-white ring-2 ring-white scale-105 shadow-lg"
                              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08]"
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
              )}

              {/* Modo: Integração com Gravatar */}
              {avatarMode === "gravatar" && (
                <div className="space-y-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <AvatarDisplay
                      avatar={customAvatarUrl || buildGravatarUrl(gravatarEmail || "user@plix.local", { defaultStyle: gravatarStyle })}
                      name={name}
                      size="lg"
                    />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Integração Gravatar
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Puxe sua foto real cadastrada no Gravatar ou gere automaticamente um avatar padrão único a partir do seu e-mail.
                      </p>
                      {gravatarStatus.tested && (
                        <div className="pt-1">
                          {gravatarStatus.hasCustomPhoto ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Foto real do Gravatar encontrada!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 bg-blue-500/15 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3" /> Avatar padrão ({gravatarStyle}) gerado
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                      Seu E-mail do Gravatar
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={gravatarEmail}
                        onChange={(e) => setGravatarEmail(e.target.value)}
                        placeholder="exemplo@email.com"
                        className="flex-1 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/15 text-white placeholder-gray-500 focus:border-white focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchGravatar()}
                        disabled={gravatarLoading || !gravatarEmail.trim()}
                        className="px-4 py-2 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        {gravatarLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Buscar</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1.5">
                      Estilo Padrão caso não tenha foto personalizada:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {GRAVATAR_STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            setGravatarStyle(style.id);
                            if (gravatarEmail.trim()) {
                              handleFetchGravatar(gravatarEmail, style.id);
                            }
                          }}
                          className={cn(
                            "p-2 text-left rounded-xl border text-[11px] transition-all cursor-pointer",
                            gravatarStyle === style.id
                              ? "bg-white text-black border-white font-bold shadow-md"
                              : "bg-white/[0.04] border-white/10 text-gray-400 hover:text-white"
                          )}
                        >
                          {style.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modo: URL Personalizada Direta */}
              {avatarMode === "url" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    URL Direta de Imagem
                  </label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/15 text-white placeholder-gray-500 focus:border-white focus:outline-none text-xs"
                  />
                  {customAvatarUrl && (
                    <div className="mt-3 flex items-center gap-3 p-3 bg-white/[0.04] rounded-2xl border border-white/10">
                      <AvatarDisplay avatar={customAvatarUrl} size="md" name={name} />
                      <span className="text-xs text-gray-300">Prévia da imagem informada</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("view")}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-xs font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50"
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
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/15 text-white placeholder-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white text-sm transition-all"
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
                          "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all border cursor-pointer",
                          isSelected
                            ? "bg-white/15 border-white ring-2 ring-white scale-105 shadow-lg"
                            : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08]"
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
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black text-xs font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Criando..." : "Criar Perfil"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer com Ação de Logout */}
        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Plix • Apple TV Experience</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
}
