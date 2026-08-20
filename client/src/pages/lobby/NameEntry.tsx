import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useNavigationType, useParams } from 'react-router';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useLobbyInfo } from '@/contexts/LobbyContext';
import { useMemberName } from '@/hooks/useMemberName';
import { useLobby } from '@/hooks/useLobby';
import { useRocketCrab } from '@/hooks/useRocketCrab';

// Zero-width / invisible code points stripped before submit, on top of the server's own sanitizer:
// ZWSP, ZWNJ, ZWJ, BOM, newline, tab.
const STRIP_CODEPOINTS = new Set([0x200b, 0x200c, 0x200d, 0xfeff, 0x0a, 0x09]);

function sanitizeName(input: string): string {
  let out = '';
  for (const ch of input) {
    if (!STRIP_CODEPOINTS.has(ch.codePointAt(0) ?? 0)) out += ch;
  }
  return out;
}

/**
 * The name-entry form. Pre-fills from the stored name, submits via `member.setName`, and shows an
 * error when the server rejects the name.
 *
 * Reclaiming a seat: if a disconnected player already holds the submitted name, that seat is taken
 * back rather than joining alongside it as a duplicate. This happens WITHOUT a prompt only when the
 * player arrived by loading the page directly, which is the reconnect case (a reload, or reopening
 * a link). Coming in from the join screen always asks, because there the player is deliberately
 * entering a lobby and should get to say who they are instead of being silently reinserted under
 * whatever name they used last.
 */
export function NameEntry() {
  const { t } = useTranslation('lobby');
  const navigate = useNavigate();
  const { code } = useParams();
  const { name: storedName, setName } = usePreferences();
  const { t: tError } = useTranslation('errors');
  const { submitName, nameLoading, nameValid, nameError } = useMemberName();
  const { nameOk, lobbyInfo } = useLobbyInfo();
  const { validLobby, replaceMember } = useLobby();
  const rocketcrab = useRocketCrab();
  // How the player arrived. A full page load - reload, or a pasted link - is POP; navigating in
  // from the join screen is PUSH.
  const navigationType = useNavigationType();
  const arrivedDirectly = navigationType === 'POP';

  const [name, setLocalName] = useState(storedName);
  const [dirty, setDirty] = useState(false);
  const rejoinedRef = useRef(false);

  // A rejected name shows an error until the user edits the field (`dirty`) or resubmits.
  const rejected = nameValid === false || nameOk === false;
  const showError = rejected && !dirty;

  // Auto-rejoin: reclaim a disconnected seat that already holds our stored name (or the RocketCrab
  // name in an rc-prefixed lobby). Fires at most once.
  useEffect(() => {
    if (rejoinedRef.current || !lobbyInfo) return;
    const target = lobbyInfo.players.find((p) => !p.connected && p.name === storedName);
    if (rocketcrab && code?.startsWith('rc')) {
      rejoinedRef.current = true;
      // Persist + submit the RocketCrab-provided name; the screen transitions on nameOk, so the
      // (now-moot) text input is left as-is rather than driving a synchronous setState here.
      setName(rocketcrab.name);
      submitName(rocketcrab.name, target ? () => replaceMember(target.playerId) : undefined);
    } else if (arrivedDirectly && validLobby && storedName && target) {
      rejoinedRef.current = true;
      submitName(storedName, () => replaceMember(target.playerId));
    }
  }, [
    lobbyInfo,
    storedName,
    rocketcrab,
    code,
    validLobby,
    arrivedDirectly,
    setName,
    submitName,
    replaceMember,
  ]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalName(event.currentTarget.value);
    setDirty(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = sanitizeName(name).trim();
    if (!clean) return;
    setName(clean);
    setDirty(false);
    // Reclaim a disconnected seat holding this name instead of joining beside it as a duplicate.
    // Sequenced behind the name: replace is a no-op server-side until the member has one.
    const target = lobbyInfo?.players.find((p) => !p.connected && p.name === clean);
    submitName(clean, target ? () => replaceMember(target.playerId) : undefined);
  };

  return (
    <MenuLayout title={t('nameEntry.title')} subtitle={t('nameEntry.subtitle')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          name="playerName"
          label={t('nameEntry.label')}
          value={name}
          onChange={handleChange}
          required
          minLength={1}
          maxLength={15}
          autoComplete="on"
          placeholder={t('nameEntry.placeholder')}
          error={nameError ? tError(nameError) : showError ? t('nameEntry.error') : undefined}
        />
        <div className="flex justify-center gap-2">
          {/* The icon keeps the button's width stable when the loading dots take its slot. */}
          <Button type="submit" variant="primary" icon="check" loading={nameLoading}>
            {t('nameEntry.submit')}
          </Button>
          <Button type="button" variant="secondary" icon="arrow left" onClick={() => navigate('/')}>
            {t('nameEntry.leave')}
          </Button>
        </div>
      </form>
    </MenuLayout>
  );
}
