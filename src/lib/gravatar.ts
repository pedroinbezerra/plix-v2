import crypto from "crypto";

export interface GravatarStyle {
  id: string;
  name: string;
  desc: string;
}

export const GRAVATAR_STYLES: GravatarStyle[] = [
  {
    id: "identicon",
    name: "Identicon (Geométrico)",
    desc: "Padrão geométrico colorido gerado a partir do seu e-mail",
  },
  {
    id: "retro",
    name: "Retro (Pixel Art)",
    desc: "Avatar estilo arcade clássico em 8 bits",
  },
  {
    id: "robohash",
    name: "Robohash (Robôs)",
    desc: "Personagens de robôs divertidos e únicos",
  },
  {
    id: "monsterid",
    name: "MonsterID (Monstrinhos)",
    desc: "Criaturas coloridas com diferentes traços",
  },
  {
    id: "wavatar",
    name: "Wavatar (Carinhas)",
    desc: "Faces cartunescas com expressões variadas",
  },
  {
    id: "mp",
    name: "Silhueta (Mystery Person)",
    desc: "Silhueta neutra e minimalista",
  },
];

export interface GravatarOptions {
  size?: number;
  defaultStyle?: string;
  rating?: "g" | "pg" | "r" | "x";
}

/**
 * Gera uma URL oficial do Gravatar a partir do e-mail.
 * Utiliza o algoritmo SHA-256 recomendado pela Automattic/Gravatar.
 */
export function buildGravatarUrl(email: string, options: GravatarOptions = {}): string {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return "";
  }

  // Gera o hash SHA-256 em hexadecimal
  const hash = crypto.createHash("sha256").update(cleanEmail).digest("hex");
  const size = Math.min(512, Math.max(32, options.size || 200));
  const defaultStyle = options.defaultStyle || "identicon";
  const rating = options.rating || "g";

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${encodeURIComponent(defaultStyle)}&r=${rating}`;
}

/**
 * Verifica se uma URL fornecida pertence ao serviço Gravatar.
 */
export function isGravatarUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return url.includes("gravatar.com/avatar/");
}
