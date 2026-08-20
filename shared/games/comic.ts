export interface ComicConfig {
  players: number;
  numPieces: number;
  numLinks: number;
  anonymous: boolean;
  colors: boolean;
  gamemode: {
    continuous: boolean;
    captions: boolean;
    show_drawings: boolean;
    show_captions: boolean;
  };
}
