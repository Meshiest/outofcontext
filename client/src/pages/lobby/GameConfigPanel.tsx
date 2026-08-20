import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import { Card } from '@/components/ui/Card/Card';
import { Statistic, StatisticLabel, StatisticValue } from '@/components/ui/Statistic/Statistic';
import { ConfigField } from './ConfigField';
import { configValue, deriveConfigText } from './configUtils';
import { configCopy } from '@/lib/gameCopy';

/** What a config control can emit. */
type ConfigValue = string | number;

export interface GameConfigPanelProps {
  /** The game this config belongs to; selects the locale namespace its copy lives in. */
  gameId: string;
  gameMeta: GameMeta;
  /** The lobby's current config overrides (defaults fill the gaps). */
  config: Record<string, unknown>;
  playerCount: number;
  isAdmin: boolean;
  /** Emits `(name, value)` for a changed field (admin only). */
  onConfigChange: (name: string, value: string | number) => void;
}

/**
 * The game's config, driven entirely by the selected game's `config` definition. Admins get editable
 * fields (via `ConfigField`); everyone else gets a read-only flex-wrap of value + label stats. The
 * label field differs by view: admin form labels use `cfg.name`, read-only stat labels use `cfg.text`.
 */
export function GameConfigPanel({
  gameId,
  gameMeta,
  config,
  playerCount,
  isAdmin,
  onConfigChange,
}: GameConfigPanelProps) {
  const { t, i18n } = useTranslation('lobby');
  const entries = Object.entries(gameMeta.config);

  // Values changed here but not yet echoed back by the server, each remembered alongside the value
  // it replaced. Without this a field snapped back to its old value the moment it lost focus and
  // then jumped forward again when `lobby:info` arrived - two flickers per edit, because the
  // control is driven by server state that takes a round trip to catch up.
  const [pending, setPending] = useState<Record<string, { value: ConfigValue; base: unknown }>>({});

  // A guess is dropped as soon as the server has SPOKEN about that key - not once it agrees. It may
  // never agree: an int out of range is clamped and an unknown list option falls back to the
  // default, so waiting for a match would pin the field to a value the lobby does not have.
  const stale = Object.keys(pending).filter(
    (name) => config[name] !== pending[name].base || config[name] === pending[name].value,
  );
  if (stale.length > 0) {
    setPending((prev) => {
      const next = { ...prev };
      for (const name of stale) delete next[name];
      return next;
    });
  }

  const shownConfig = { ...config } as Record<string, unknown>;
  for (const [name, entry] of Object.entries(pending)) shownConfig[name] = entry.value;

  const handleChange = (name: string, value: ConfigValue) => {
    setPending((prev) => ({ ...prev, [name]: { value, base: config[name] } }));
    onConfigChange(name, value);
  };

  if (isAdmin) {
    return (
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
        className="flex flex-col gap-4 text-left"
      >
        {entries.map(([name, cfg]) => (
          <ConfigField
            key={name}
            gameId={gameId}
            name={name}
            cfg={cfg}
            rawValue={configValue(shownConfig, cfg, name)}
            playerCount={playerCount}
            onChange={handleChange}
          />
        ))}
      </form>
    );
  }

  const labels = { yes: t('config.yes'), no: t('config.no'), unknown: t('config.unknown') };

  return (
    <Card>
      <div className="flex flex-row flex-wrap items-center justify-center gap-4 p-4">
        {entries.map(([name, cfg]) => (
          <Statistic key={name}>
            <StatisticValue>
              {deriveConfigText(
                cfg,
                configValue(shownConfig, cfg, name),
                playerCount,
                labels,
                // `options`, not `optionsMore`: a stat is a value, not an explanation of it.
                (option) => configCopy(i18n, gameId, `${name}.options.${option}`) || null,
              )}
            </StatisticValue>
            <StatisticLabel>{configCopy(i18n, gameId, `${name}.text`)}</StatisticLabel>
          </Statistic>
        ))}
      </div>
    </Card>
  );
}
