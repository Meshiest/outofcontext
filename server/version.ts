import { readFileSync } from 'node:fs';

// Read the package version without a JSON import (ESM-friendly, no resolveJsonModule emit quirks).
const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

export const VERSION: string = pkg.version;
