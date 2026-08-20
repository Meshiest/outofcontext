import type { PlayerState } from '../types';

export interface StoryConfig {
  players: number;
  numStories: number;
  numLinks: number;
  anonymous: boolean;
  contextLen: number;
}

export interface StoryPlayerStateEditing extends PlayerState {
  state: 'EDITING';
  isLastLink: boolean;
  link: string[];
}

export interface StoryPlayerStateWaiting extends PlayerState {
  state: 'WAITING' | 'READING';
  liked?: boolean[];
}

export type StoryPlayerState = StoryPlayerStateEditing | StoryPlayerStateWaiting;
