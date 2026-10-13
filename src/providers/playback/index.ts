import { IPlaybackProvider } from "./playback-provider.interface";
import { playbackProvider as warezCdnPlaybackProvider } from "./warezcdn-playback.provider";
import { pomfyPlaybackProvider } from "./pomfy-playback.provider";
import { streambetterPlaybackProvider } from "./streambetter-playback.provider";

export * from "./playback-provider.interface";
export * from "./types";
export { warezCdnPlaybackProvider, pomfyPlaybackProvider, streambetterPlaybackProvider };

export type PlaybackProviderId = "warez" | "pomfy" | "streambetter";

export interface PlaybackProviderMetadata {
  id: PlaybackProviderId;
  name: string;
  label: string;
}

export const PLAYBACK_PROVIDERS: PlaybackProviderMetadata[] = [
  { id: "warez", name: "WarezCDN", label: "Servidor 1 (WarezCDN)" },
  { id: "pomfy", name: "Pomfy", label: "Servidor 2 (Pomfy)" },
  { id: "streambetter", name: "StreamBetter", label: "Servidor 3 (StreamBetter)" },
];

export const DEFAULT_PLAYBACK_PROVIDER: PlaybackProviderId =
  (process.env.DEFAULT_PLAYBACK_PROVIDER as PlaybackProviderId) || "warez";

export function getPlaybackProvider(providerId?: string | null): IPlaybackProvider {
  if (providerId === "pomfy") {
    return pomfyPlaybackProvider;
  }
  if (providerId === "streambetter") {
    return streambetterPlaybackProvider;
  }
  return warezCdnPlaybackProvider;
}
