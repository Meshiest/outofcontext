import { z } from 'zod';
import { EMOTES } from '../emotes.js';
import { GAME_MESSAGE_TYPES } from '@shared/events';
import gameInfo from '../../gameInfo.js';

export const emoteSchema = z.enum(EMOTES as unknown as [string, ...string[]]);

// A game key that actually exists in the backend registry.
export const gameIdSchema = z.enum(
  Object.keys(gameInfo) as [string, ...string[]],
);

// Raw config value is a number or an option-name/sentinel string.
export const configPatchSchema = z.object({
  name: z.string(),
  value: z.union([z.number(), z.string()]),
});

export const gameMessageSchema = z.object({
  type: z.enum(GAME_MESSAGE_TYPES),
  data: z.unknown(),
});

// Lobby codes are alphanumeric (`[a-z0-9]`, optionally an `rc` rocketcrab prefix, length grows only on
// astronomically-rare collisions). Constrain the charset + length: this value flows into filesystem
// paths in Persistence (`persistence/${code}.json.zip`), so an unbounded string would be a path-
// traversal / existence oracle (e.g. `../../../../foo`). Case-insensitive - the handlers lowercase it.
export const codeSchema = z.string().regex(/^[a-z0-9]{4,32}$/i);
export const playerIdSchema = z.string().min(1);
export const nameSchema = z.string();
export const rocketcrabSchema = z.object({
  game: z.string(),
  version: z.number(),
});
