export interface PlaybackOptions {
  noEpList?: boolean;
  noLink?: boolean;
  transparent?: boolean;
  color?: string; // hex sem #, ex: 'e50914'
}

export interface PlayerStreamConfig {
  streamUrl: string;
  allowDirectives: string;
}
