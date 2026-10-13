import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSeconds(totalSeconds?: number | null): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatReleaseYear(dateStr?: string | null): string {
  if (!dateStr) return "";
  const year = dateStr.split("-")[0];
  return year || "";
}

export function formatMediaDuration(options: {
  mediaType?: string;
  runtime?: number | null;
  seasonsCount?: number | null;
  episodesCount?: number | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
}): string {
  const { mediaType, runtime, seasonsCount, episodesCount, seasonNumber, episodeNumber } = options;

  // Episódio específico (ex: T1, E4)
  if (seasonNumber && episodeNumber) {
    return runtime && runtime > 0 ? formatMinutes(runtime) : "";
  }

  const isMovie = mediaType === "FILME";
  if (isMovie) {
    return runtime && runtime > 0 ? formatMinutes(runtime) : "";
  }

  // Série / Anime / Dorama:
  // Se temos contagem total de episódios e duração por episódio, calcula o tempo total
  if (episodesCount && episodesCount > 0 && runtime && runtime > 0) {
    const totalMinutes = episodesCount * runtime;
    return formatMinutes(totalMinutes);
  }

  // Se temos a duração de cada episódio
  if (runtime && runtime > 0) {
    return formatMinutes(runtime);
  }

  // Fallbacks de contagem
  if (episodesCount && episodesCount > 0) {
    return `${episodesCount} eps`;
  }

  if (seasonsCount && seasonsCount > 0) {
    return seasonsCount === 1 ? "1 temp" : `${seasonsCount} temps`;
  }

  return "";
}
