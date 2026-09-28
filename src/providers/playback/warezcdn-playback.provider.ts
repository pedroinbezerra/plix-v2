import { IPlaybackProvider } from "./playback-provider.interface";
import { PlaybackOptions, PlayerStreamConfig } from "./types";

const BASE_URL = (process.env.PLAYBACK_PROVIDER_BASE_URL || "https://warezcdn.sbs").replace(/\/+$/, "");

export class WarezCdnPlaybackProvider implements IPlaybackProvider {
  private readonly defaultAllow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *";

  private sanitizeId(id: string): string {
    const clean = String(id).trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      throw new Error(`ID de mídia inválido: ${id}`);
    }
    return clean;
  }

  private buildFragment(options: PlaybackOptions = {}): string {
    const fragments: string[] = [];

    // Por padrão ativamos noEpList conforme instrução do projeto
    if (options.noEpList !== false) {
      fragments.push("noEpList");
    }

    if (options.noLink) {
      fragments.push("noLink");
    }

    if (options.transparent) {
      fragments.push("transparent");
    }

    if (options.color) {
      const cleanColor = options.color.replace(/^#/, "");
      if (/^[0-9a-fA-F]{3,6}$/.test(cleanColor)) {
        fragments.push(`color=${cleanColor}`);
      }
    }

    return fragments.length > 0 ? `#${fragments.join("&")}` : "";
  }

  getMoviePlayerConfig(tmdbId: string, options: PlaybackOptions = {}): PlayerStreamConfig {
    const cleanId = this.sanitizeId(tmdbId);
    const fragment = this.buildFragment(options);

    return {
      streamUrl: `${BASE_URL}/filme/${cleanId}${fragment}`,
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
    const fragment = this.buildFragment(options);

    return {
      streamUrl: `${BASE_URL}/serie/${cleanId}/${season}/${episode}${fragment}`,
      allowDirectives: this.defaultAllow,
    };
  }
}

// Singleton do PlaybackProvider
export const playbackProvider: IPlaybackProvider = new WarezCdnPlaybackProvider();
