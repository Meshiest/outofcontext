import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';
import { Dimmer } from '@/components/ui/Dimmer/Dimmer';
import { Loader } from '@/components/ui/Loader/Loader';
import { useConnection } from '@/contexts/LobbyContext';

/**
 * Full-screen overlay for the two ways a session stops working. Both offer a way out.
 *
 * Being reaped for inactivity is terminal - the server has forgotten the member, so reconnecting
 * silently produces a session with no lobby - and it says so. It takes priority because the kick
 * arrives just before the stream closes and would otherwise sit behind the reconnect spinner.
 *
 * A dropped stream is usually transient and the client retries on its own, but not always: a member
 * whose stream was already closed when the inactivity sweep took it never receives the kick at all,
 * and would otherwise watch a spinner that can never succeed. So it gets a reconnect button
 * alongside the spinner rather than being a dead end.
 *
 * Shows only after the stream has connected at least once, so the initial connect never flashes it.
 * Dimmer renders nothing while inactive.
 */
export function ConnectionOverlay() {
  const { t } = useTranslation('common');
  const { disconnected, kicked } = useConnection();

  if (kicked) {
    return (
      <Dimmer active aria-live="assertive">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-white">{t('connection.kicked')}</p>
          <Button variant="primary" icon="undo" onClick={() => location.reload()}>
            {t('connection.refresh')}
          </Button>
        </div>
      </Dimmer>
    );
  }

  return (
    <Dimmer active={disconnected} aria-live="assertive">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader size="lg" label={t('connection.lost')}>
          {t('connection.lost')}
        </Loader>
        <Button variant="secondary" icon="undo" onClick={() => location.reload()}>
          {t('connection.reconnect')}
        </Button>
      </div>
    </Dimmer>
  );
}
