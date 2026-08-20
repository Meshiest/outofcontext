import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface RocketCrab {
  name: string;
  isHost: boolean;
}

// Code points stripped from an incoming RocketCrab name: U+200B (zero-width space), U+200C (ZWNJ),
// U+200D (ZWJ), U+FEFF (BOM), newline (0x0A), tab (0x09).
// Using a code-point Set instead of a regex keeps this source pure ASCII and sidesteps the
// misleading-character-class lint for the zero-width sequence.
const STRIP_CODEPOINTS = new Set([0x200b, 0x200c, 0x200d, 0xfeff, 0x0a, 0x09]);

function stripName(input: string): string {
  let out = '';
  for (const ch of input) {
    if (!STRIP_CODEPOINTS.has(ch.codePointAt(0) ?? 0)) out += ch;
  }
  return out;
}

/**
 * Parses RocketCrab query params (the third-party platform embeds OOC in an iframe and passes the
 * player name + host flag via the URL). Returns null when not in RocketCrab mode. Pure parsing - the
 * auto-join/name-submit integration lives in the Lobby page. Sanitization: strip zero-width/control
 * chars, trim, default to 'Player', cap at 15 chars.
 */
export function useRocketCrab(): RocketCrab | null {
  const [params] = useSearchParams();

  return useMemo(() => {
    if (params.get('rocketcrab') !== 'true') return null;

    let name = stripName(params.get('name') || '').trim();
    if (!name) name = 'Player';
    if (name.length >= 16) name = name.slice(0, 15);

    return { name, isHost: params.get('ishost') === 'true' };
  }, [params]);
}
