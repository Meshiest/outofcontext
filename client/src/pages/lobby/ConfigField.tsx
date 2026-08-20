import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfigFieldDef } from '@shared/types';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { DEFAULT_MAX, NUM_PLAYERS, deriveConfigValue } from './configUtils';
import { configCopy } from '@/lib/gameCopy';

export interface ConfigFieldProps {
  /** The game this config belongs to; selects the locale namespace its copy lives in. */
  gameId: string;
  /** Config key (e.g. "numLinks"); passed back on change. */
  name: string;
  /** The field's shape (type, bounds, option ids) from gameInfo. */
  cfg: ConfigFieldDef;
  /** The current raw value (lobby override or default) - still `'#numPlayers'` / number / option name. */
  rawValue: string | number;
  playerCount: number;
  onChange: (name: string, value: string | number) => void;
}

/**
 * A single admin config control, rendered by type. `int` is a clamped number input with an optional
 * "use player count" (`'#numPlayers'`) toggle and min/max warnings; `bool` and `list` are dropdowns.
 * Data-driven - the field shape comes entirely from the game's gameInfo config, never hardcoded.
 */
export function ConfigField({
  gameId,
  name,
  cfg,
  rawValue,
  playerCount,
  onChange,
}: ConfigFieldProps) {
  const { t, i18n } = useTranslation('lobby');
  const label = configCopy(i18n, gameId, `${name}.name`);
  // While the number field is focused it is driven by a local draft string, not the server-derived
  // value, so typing is not fought by async lobby:info echoes and a below-min leading digit (e.g. "1"
  // toward "15" in a min-3 field) is not snapped up mid-entry. The value is clamped to [min,max] and
  // committed on blur / Enter.
  const [draft, setDraft] = useState<string | null>(null);

  if (cfg.type === 'int') {
    const derived = deriveConfigValue(cfg, rawValue, playerCount) as number;
    const maxBound = cfg.max ?? DEFAULT_MAX;
    const minBound = cfg.min ?? 0;
    const isNumPlayers = rawValue === NUM_PLAYERS;
    const showMax = cfg.max !== undefined && derived > cfg.max;
    const showMin =
      cfg.min !== undefined && (derived < cfg.min || (isNumPlayers && playerCount < cfg.min));

    const commit = (raw: string) => {
      setDraft(null);
      if (raw.trim() === '') return;
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) return;
      onChange(name, Math.min(maxBound, Math.max(minBound, parsed)));
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') event.currentTarget.blur();
    };

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-2">
          <Input
            className="flex-1"
            type="number"
            label={label}
            value={draft ?? String(derived)}
            min={cfg.min}
            max={maxBound}
            autoComplete="off"
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={(event) => commit(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          {cfg.defaults === NUM_PLAYERS && (
            <Button
              type="button"
              iconButton
              icon="users"
              aria-label={t('config.numPlayers')}
              color={isNumPlayers ? 'blue' : undefined}
              variant={isNumPlayers ? 'primary' : 'basic'}
              onClick={() => onChange(name, NUM_PLAYERS)}
            />
          )}
        </div>
        {showMax && cfg.max !== undefined && (
          <p className="text-sm text-negative">{t('config.maximum', { max: cfg.max })}</p>
        )}
        {showMin && cfg.min !== undefined && (
          <p className="text-sm text-negative">{t('config.minimum', { min: cfg.min })}</p>
        )}
      </div>
    );
  }

  if (cfg.type === 'bool') {
    return (
      <Select
        label={label}
        value={String(deriveConfigValue(cfg, rawValue, playerCount))}
        options={[
          { text: t('config.enabled'), value: 'true' },
          { text: t('config.disabled'), value: 'false' },
        ]}
        onChange={(value) => onChange(name, value)}
      />
    );
  }

  return (
    <Select
      label={label}
      value={String(deriveConfigValue(cfg, rawValue, playerCount))}
      options={(cfg.options ?? []).map((option) => ({
        // The expanded label where there is one - a dropdown is where the choice is made, so it
        // should say what the choice does. The bare label is what the read-only stat shows.
        text:
          configCopy(i18n, gameId, `${name}.optionsMore.${option.name}`) ||
          configCopy(i18n, gameId, `${name}.options.${option.name}`),
        value: option.name,
      }))}
      onChange={(value) => onChange(name, value)}
    />
  );
}
