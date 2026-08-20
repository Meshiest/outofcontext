import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useLobby } from '@/hooks/useLobby';
import { useConnection } from '@/contexts/LobbyContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { trpc } from '@/trpc/trpc';

export interface JoinLobbyModalProps {
  open: boolean;
  onClose: () => void;
}

// Live input constraint: lowercase and drop everything that is not a-z0-9, capped at the server's
// maximum code length. NOT capped at 4: codes grow past that on collision, and RocketCrab lobbies
// carry an `rc` prefix, so truncating to 4 made those lobbies impossible to join.
const MAX_CODE_LENGTH = 32;

function normalizeCode(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, MAX_CODE_LENGTH);
}

/**
 * Join-by-code modal. Validates the typed code against `lobby.exists` and, on success, joins via
 * `useLobby` and routes to `/lobby/{code}`. Under streamer mode the code input masks to `password`
 * so a shared screen never leaks the lobby code.
 */
export function JoinLobbyModal({ open, onClose }: JoinLobbyModalProps) {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const { joinLobby } = useLobby();
  const { disconnected } = useConnection();
  const { streamerMode } = usePreferences();
  const utils = trpc.useUtils();

  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset transient state whenever the modal is dismissed so a reopen starts clean. Done with the
  // render-time "adjust state when a prop changes" pattern (guarded setState in render, not an
  // effect) to avoid a cascading-render effect.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setCode('');
      setError(false);
      setLoading(false);
    }
  }

  // Losing the connection while the modal is open closes it (the global overlay takes over).
  useEffect(() => {
    if (open && disconnected) onClose();
  }, [open, disconnected, onClose]);

  // Focus the code field on open. The dialog's children stay mounted across open/close, so React's
  // `autoFocus` would only ever fire on the first mount; the rAF lets the dialog finish its own
  // focus handling first, otherwise showModal() moves focus after us.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCode(normalizeCode(event.currentTarget.value));
    setError(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      const ok = await utils.lobby.exists.fetch(code);
      if (ok) {
        joinLobby(code);
        navigate('/lobby/' + code);
        onClose();
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('join.title')}
      closeLabel={t('join.close')}
      // Narrower than the default dialog: the only field is a 4-character code, so a wide panel
      // just strands the input in the middle of it.
      className="w-[min(92vw,24rem)]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          ref={inputRef}
          size="lg"
          maxLength={MAX_CODE_LENGTH}
          reserveErrorSpace
          // Matches the lobby-code keycaps: sans, bold, uppercase. The value stays lowercase (the
          // server lowercases anyway); only the display is capitalised. Input's own className lands
          // on the wrapper, hence the child selector.
          className="[&_input]:text-center [&_input]:font-sans [&_input]:text-xl [&_input]:font-bold [&_input]:uppercase [&_input]:tracking-[0.2em]"
          label={t('join.codeLabel')}
          value={code}
          onChange={handleChange}
          autoComplete="off"
          placeholder={t('join.placeholder')}
          type={streamerMode ? 'password' : 'text'}
          error={error ? t('join.invalid') : undefined}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('join.cancel')}
          </Button>
          {/* Icon is not decoration: the loading dots take the icon's slot, so a button that has one
              keeps its width when it flips to loading instead of jumping. */}
          <Button
            type="submit"
            variant="primary"
            icon="arrow right"
            loading={loading}
            disabled={!code}
          >
            {t('join.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
