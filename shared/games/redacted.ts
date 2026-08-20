export interface RedactedConfig {
  players: number;
  numStories: number;
  numLinks: number;
  anonymous: boolean;
  edits: number;
  gamemode: {
    censor: 'player' | 'random' | 'none';
    truncate: 'player' | 'random' | 'none';
  };
  ink: number;
}
