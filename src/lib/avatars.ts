export interface AvatarPreset {
  id: string;
  name: string;
  gradient: string;
  textColor: string;
  accentColor: string;
  initials?: string;
  iconName: "film" | "star" | "sparkles" | "gamepad" | "crown" | "heart" | "tv" | "smile";
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "avatar-1",
    name: "Crimson Cinema",
    gradient: "from-red-600 to-rose-900",
    textColor: "text-white",
    accentColor: "#e50914",
    iconName: "film",
  },
  {
    id: "avatar-2",
    name: "Deep Ocean",
    gradient: "from-blue-600 to-indigo-900",
    textColor: "text-white",
    accentColor: "#2563eb",
    iconName: "star",
  },
  {
    id: "avatar-3",
    name: "Emerald Stream",
    gradient: "from-emerald-500 to-teal-900",
    textColor: "text-white",
    accentColor: "#10b981",
    iconName: "gamepad",
  },
  {
    id: "avatar-4",
    name: "Purple Neon",
    gradient: "from-purple-600 to-violet-950",
    textColor: "text-white",
    accentColor: "#9333ea",
    iconName: "sparkles",
  },
  {
    id: "avatar-5",
    name: "Golden Crown",
    gradient: "from-amber-500 to-yellow-800",
    textColor: "text-white",
    accentColor: "#f59e0b",
    iconName: "crown",
  },
  {
    id: "avatar-6",
    name: "Rose Romance",
    gradient: "from-rose-500 to-pink-900",
    textColor: "text-white",
    accentColor: "#f43f5e",
    iconName: "heart",
  },
  {
    id: "avatar-7",
    name: "Cyber Cyan",
    gradient: "from-cyan-500 to-blue-900",
    textColor: "text-white",
    accentColor: "#06b6d4",
    iconName: "tv",
  },
  {
    id: "avatar-8",
    name: "Sunset Happy",
    gradient: "from-orange-500 to-red-800",
    textColor: "text-white",
    accentColor: "#ea580c",
    iconName: "smile",
  },
];

export function getAvatarPreset(avatarId?: string | null): AvatarPreset {
  const found = AVATAR_PRESETS.find((p) => p.id === avatarId);
  return found || AVATAR_PRESETS[0];
}
