"use client";

import React from "react";
import Image from "next/image";
import { Film, Star, Sparkles, Gamepad2, Crown, Heart, Tv, Smile } from "lucide-react";
import { getAvatarPreset } from "@/lib/avatars";
import { cn } from "@/lib/utils";

interface AvatarDisplayProps {
  avatar?: string | null;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AvatarDisplay({
  avatar,
  name,
  className,
  size = "md",
}: AvatarDisplayProps) {
  const isUrl = avatar?.startsWith("http://") || avatar?.startsWith("https://");
  const preset = getAvatarPreset(avatar);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-7 h-7",
    xl: "w-10 h-10",
  };

  const [imgError, setImgError] = React.useState(false);

  if (isUrl && avatar && !imgError) {
    return (
      <div
        className={cn(
          "relative rounded-xl overflow-hidden bg-surface-light border border-white/20 shadow-md flex-shrink-0",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={avatar}
          alt={name || "Avatar"}
          fill
          unoptimized
          onError={() => setImgError(true)}
          className="object-cover"
        />
      </div>
    );
  }

  const renderIcon = () => {
    const iconClass = cn("text-white fill-white/20", iconSizes[size]);
    switch (preset.iconName) {
      case "film":
        return <Film className={iconClass} />;
      case "star":
        return <Star className={iconClass} />;
      case "sparkles":
        return <Sparkles className={iconClass} />;
      case "gamepad":
        return <Gamepad2 className={iconClass} />;
      case "crown":
        return <Crown className={iconClass} />;
      case "heart":
        return <Heart className={iconClass} />;
      case "tv":
        return <Tv className={iconClass} />;
      case "smile":
        return <Smile className={iconClass} />;
      default:
        return <Film className={iconClass} />;
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md border border-white/10 select-none flex-shrink-0 transition-transform",
        preset.gradient,
        sizeClasses[size],
        className
      )}
    >
      {renderIcon()}
    </div>
  );
}
