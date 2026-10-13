import { IPlaybackProvider } from "./playback-provider.interface";
import { PlaybackOptions, PlayerStreamConfig } from "./types";

const BASE_URL = (process.env.STREAMBETTER_PLAYBACK_BASE_URL || "https://streambetter.shop").replace(/\/+$/, "");

export class StreamBetterPlaybackProvider implements IPlaybackProvider {
  private readonly defaultAllow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *";

  private sanitizeId(id: string): string {
    const clean = String(id).trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      throw new Error(`ID de mídia inválido: ${id}`);
    }
    return clean;
  }

  getMoviePlayerConfig(tmdbId: string, options: PlaybackOptions = {}): PlayerStreamConfig {
    const cleanId = this.sanitizeId(tmdbId);

    return {
      streamUrl: `${BASE_URL}/filme/${cleanId}`,
      allowDirectives: this.defaultAllow,
    };
  }

  getSeriesPlayerConfig(
    tmdbId: string,
    seasonNumber: number,
    episodeNumber: number,
    options: PlaybackOptions = {}
  ): PlayerStreamConfig {
    const cleanId = this.sanitizeId(tmdbId);
    const season = Math.max(1, Math.floor(seasonNumber || 1));
    const episode = Math.max(1, Math.floor(episodeNumber || 1));

    return {
      streamUrl: `${BASE_URL}/serie/${cleanId}/${season}/${episode}`,
      allowDirectives: this.defaultAllow,
    };
  }
}

// Singleton do StreamBetterPlaybackProvider
export const streambetterPlaybackProvider: IPlaybackProvider = new StreamBetterPlaybackProvider();
