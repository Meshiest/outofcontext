import type { ConfigFieldDef } from '@shared/types';

/**
 * The player-count range for a game's footer, from its `players` config field: "{min}-{max}",
 * collapsing to "{min}+" when the max is the 256 sentinel (or absent).
 */
export function formatPlayerRange(players: ConfigFieldDef | undefined): string {
  const min = players?.min ?? 0;
  const max = players?.max;
  if (max === undefined || max === 256) return `${min}+`;
  return `${min}-${max}`;
}
