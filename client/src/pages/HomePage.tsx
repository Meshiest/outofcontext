import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { cn } from '@/components/lib/cn';
import { PageWrapper } from '@/components/widgets/PageWrapper';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { Divider } from '@/components/ui/Divider/Divider';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';
import type { IconName } from '@/components/ui/Icon/icon-map';
import { useLobby } from '@/hooks/useLobby';
import { useConnection } from '@/contexts/LobbyContext';
import { AppWordmark } from '@/components/widgets/AppWordmark';
import { JoinLobbyModal } from './JoinLobbyModal';

// Buttons that navigate must be real anchors (so href/target/middle-click work), but should read as
// buttons. Compose the same pressed-smooth skin the Button component uses onto a Link/<a>.
const LINK_BUTTON_CLASS =
  'relative inline-flex w-full select-none items-center justify-center gap-2 h-11 rounded-md border px-4 text-[13px] font-sans font-bold uppercase leading-none tracking-[0.1em] whitespace-nowrap btn-skin';

function LinkButton({
  to,
  href,
  icon,
  skin = 'btn-neutral',
  children,
}: {
  to?: string;
  href?: string;
  icon?: IconName;
  skin?: string;
  children: ReactNode;
}) {
  const className = cn(LINK_BUTTON_CLASS, skin);
  // Wide buttons pin the icon to the left edge (label stays centered), matching the Button component.
  const inner = (
    <>
      {icon && (
        <span className="absolute top-1/2 left-4 inline-flex -translate-y-1/2 items-center">
          <Icon name={icon} size="sm" className="btn-ico" />
        </span>
      )}
      <span>{children}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to ?? '/'} className={className}>
      {inner}
    </Link>
  );
}

/**
 * Landing page: create or join a lobby, plus links to the game list and the project's GitHub. On
 * mount it leaves any stale lobby membership; after a create it routes to the new lobby.
 */
export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const { connected } = useConnection();
  const { createLobby, leaveLobby, creatingLobby } = useLobby();

  const [showJoin, setShowJoin] = useState(false);

  // Clear any stale membership exactly once on mount (leaveLobby's identity may churn with the
  // underlying mutation, so guard with a ref instead of trusting an empty dep array).
  const leftRef = useRef(false);
  useEffect(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    leaveLobby();
  }, [leaveLobby]);

  // Route to the freshly-created lobby using the code the create mutation RETURNS (authoritative).
  // Relying on the `lobby:join` SSE event to land in context and then navigating on it was racy: a
  // create that early-returns an existing lobby, or an event lost across an SSE reconnect, left the
  // button flashing its loader with no navigation. A code lingering in context is never used.
  const handleCreate = () => {
    createLobby((newCode) => navigate('/lobby/' + newCode));
  };

  const createBusy = !connected || creatingLobby;

  return (
    <PageWrapper>
      <MenuLayout title={<AppWordmark />} subtitle={t('subtitle')}>
        <Divider>{t('sections.lobby')}</Divider>
        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            variant="positive"
            icon="plus"
            loading={createBusy}
            disabled={createBusy}
            onClick={handleCreate}
          >
            {t('buttons.create')}
          </Button>
          <Button
            fullWidth
            variant="primary"
            icon="arrow right"
            loading={!connected}
            disabled={!connected}
            onClick={() => setShowJoin(true)}
          >
            {t('buttons.join')}
          </Button>
        </div>

        <Divider>{t('sections.info')}</Divider>
        <div className="flex flex-col gap-2">
          <LinkButton to="/games" icon="info">
            {t('buttons.gameInfo')}
          </LinkButton>
          <LinkButton href="https://github.com/meshiest/outofcontext" icon="book open">
            {t('buttons.readCode')}
          </LinkButton>
          <LinkButton href="https://github.com/meshiest/outofcontext/issues/new" icon="bug">
            {t('buttons.requestGame')}
          </LinkButton>
        </div>
      </MenuLayout>

      <JoinLobbyModal open={showJoin} onClose={() => setShowJoin(false)} />
    </PageWrapper>
  );
}
