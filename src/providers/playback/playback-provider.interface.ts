import { PlaybackOptions, PlayerStreamConfig } from "./types";

export interface IPlaybackProvider {
  /**
   * Constrói a URL segura para reprodução de filmes.
   */
  getMoviePlayerConfig(tmdbId: string, options?: PlaybackOptions): PlayerStreamConfig;

  /**
   * Constrói a URL segura para reprodução de séries, animes e doramas.
   */
  getSeriesPlayerConfig(
    tmdbId: string,
    seasonNumber: number,
    episodeNumber: number,
    options?: PlaybackOptions
  ): PlayerStreamConfig;
}
