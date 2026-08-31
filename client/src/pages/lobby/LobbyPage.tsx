import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { trpc } from '@/trpc/trpc';
import { PageWrapper } from '@/components/widgets/PageWrapper';
import { MenuLayout } from '@/components/widgets/MenuLayout';
import { Divider } from '@/components/ui/Divider/Divider';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';
import { Loader } from '@/components/ui/Loader/Loader';
import { useLobby } from '@/hooks/useLobby';
import { useLobbyAdmin } from '@/hooks/useLobbyAdmin';
import { useConnection, useLobbyInfo } from '@/contexts/LobbyContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRocketCrab } from '@/hooks/useRocketCrab';
import { JoinLobbyModal } from '@/pages/JoinLobbyModal';
import { NameEntry } from './NameEntry';
import { LobbyWaiting } from './LobbyWaiting';
import { LobbyPlaying } from './LobbyPlaying';

type ClientState = 'NO_LOBBY' | 'LOADING' | 'NAME_ENTRY' | 'WAITING' | 'PLAYING';

// A react-router Link wearing the neutral pressed-smooth button skin (real anchor for the redirect
// links, so href/middle-click work). Matches the HomePage/GameListPage treatment.
const LINK_BUTTON_CLASS =
  'btn-skin btn-neutral relative inline-flex h-11 w-full select-none items-center justify-center gap-2 rounded-md border px-4 font-sans text-[13px] font-bold uppercase leading-none tracking-[0.1em]';

// Wide buttons pin their icon to the left edge and keep the label centered, matching Button.
const LINK_ICON_CLASS = 'absolute top-1/2 left-4 inline-flex -translate-y-1/2 items-center';

/**
 * The lobby route container and its client state machine. On mount (and on reconnect) it validates
 * the route code via `lobby.exists`; a valid code joins the lobby and moves to name entry, then to
 * the waiting or playing screen once the name is accepted (server `nameOk`). An invalid code, a code
 * shorter than 4 chars, or a dropped connection lands on the NO_LOBBY screen. The persistent lobby
 * code (hidden in streamer mode) and admin-shield badges live here, above the per-state screens.
 */
export function LobbyPage() {
  const { t } = useTranslation('lobby');
  const navigate = useNavigate();
  const { code: routeCode } = useParams();
  const utils = trpc.useUtils();

  const { lobbyInfo, playerId, nameOk } = useLobbyInfo();
  const { joinLobby, createLobby, creatingLobby } = useLobby();
  const { isAdmin } = useLobbyAdmin();
  const { connected, disconnected } = useConnection();
  const { streamerMode } = usePreferences();
  const rocketcrab = useRocketCrab();

  // Validation result keyed by the code it applies to, so a route change reads as "still checking"
  // (LOADING) until the new code resolves - without a synchronous reset in the effect body.
  const [result, setResult] = useState<{ code: string; ok: boolean } | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [revalidateToken, setRevalidateToken] = useState(0);

  const sawDisconnectRef = useRef(false);

  // `joinLobby` and `utils` get fresh identities on many renders (their tRPC mutation/query-utils
  // objects are recreated), so they must NOT be effect deps - listing them re-runs the validation
  // effect every render, and each re-run fires the PREVIOUS run's `cancelled = true` cleanup, killing
  // the in-flight fetch with no retry (stuck LOADING, never joins). Read them through latest-value
  // refs (updated in an effect, not during render) and depend only on the route code + revalidate token.
  const joinLobbyRef = useRef(joinLobby);
  const utilsRef = useRef(utils);
  useEffect(() => {
    joinLobbyRef.current = joinLobby;
    utilsRef.current = utils;
  });

  // Validate the route code; a valid code joins the lobby. State is written only in the async
  // callbacks so the effect body stays side-effect-only.
  useEffect(() => {
    if (!routeCode || routeCode.length < 4) return;

    // Re-fetch on every routeCode / revalidate-token change; the `cancelled` flag drops a stale
    // resolve. There is deliberately NO "already validated this code" ref-guard: with StrictMode's
    // dev-only mount -> unmount -> mount, such a guard makes the second mount early-return while the
    // first mount's fetch was already cancelled by its cleanup, so `result` is never set and the
    // page hangs forever on LOADING (the join / lobby-entry stuck-loader bug).
    let cancelled = false;
    utilsRef.current.lobby.exists
      .fetch(routeCode)
      .then((ok) => {
        if (cancelled) return;
        setResult({ code: routeCode, ok });
        if (ok) joinLobbyRef.current(routeCode);
      })
      .catch(() => {
        if (!cancelled) setResult({ code: routeCode, ok: false });
      });

    return () => {
      cancelled = true;
    };
  }, [routeCode, revalidateToken]);

  // Re-validate + re-join only after a real drop-then-recover, never on the initial connect. The
  // server resumes the SAME member within its grace window, so this mostly refreshes lobby/game state.
  useEffect(() => {
    if (disconnected) {
      sawDisconnectRef.current = true;
    } else if (connected && sawDisconnectRef.current) {
      sawDisconnectRef.current = false;
      setRevalidateToken((n) => n + 1);
    }
  }, [connected, disconnected]);

  // The validation result only counts when it matches the current route code.
  const validatedOk = result && result.code === routeCode ? result.ok : null;

  let clientState: ClientState;
  // A transient disconnect does NOT drop back to NO_LOBBY: the game/name screen stays mounted (so
  // in-progress input survives a blip) and the global ConnectionOverlay signals the reconnect. The
  // server resumes the same member within its grace window; only an invalid/short/absent code is
  // NO_LOBBY here.
  if (!routeCode || routeCode.length < 4 || validatedOk === false) {
    clientState = 'NO_LOBBY';
  } else if (validatedOk === null) {
    clientState = 'LOADING';
  } else if (nameOk === true) {
    clientState = lobbyInfo?.state === 'PLAYING' ? 'PLAYING' : 'WAITING';
  } else {
    clientState = 'NAME_ENTRY';
  }

  const inLobby =
    clientState === 'NAME_ENTRY' || clientState === 'WAITING' || clientState === 'PLAYING';
  // WAITING/PLAYING embed the User Preferences panel under the members rail, so suppress the global
  // bottom panel for those states (NAME_ENTRY / NO_LOBBY keep it).
  const embedSettings = clientState === 'WAITING' || clientState === 'PLAYING';
  // WAITING/PLAYING need the lobby payload; show the overlay until it arrives.
  const awaitingInfo = (clientState === 'WAITING' || clientState === 'PLAYING') && !lobbyInfo;
  const showOverlay = clientState === 'LOADING' || awaitingInfo;

  const createBusy = !connected || creatingLobby;

  // Route to the freshly-created lobby using the code the create mutation returns (authoritative),
  // not a code lingering in context. See HomePage for the rationale.
  const handleCreate = () => {
    createLobby((newCode) => navigate('/lobby/' + newCode));
  };

  return (
    // Settings are also suppressed behind the loading overlay: with no content above it yet, the
    // panel would otherwise flash at the top of an empty page before the lobby layout resolves.
    <PageWrapper hideSettings={embedSettings || showOverlay}>
      {/* Persistent lobby-code + admin chips, FIXED to the top of the viewport so they stay pinned as
          the page scrolls. Each chip is flush to its corner (no top and no outer-side border) with
          keycap / tinted physicality. The empty spacer spans keep justify-between corner alignment. */}
      {inLobby && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between">
          {!streamerMode && !rocketcrab && routeCode ? (
            <div
              className="keycap pointer-events-auto rounded-none rounded-br-lg border-t-0 border-l-0 py-2 pl-4 pr-3 text-xl leading-none font-bold tracking-[0.3em]"
              aria-label={t('badges.lobbyCode')}
            >
              {routeCode.toUpperCase()}
            </div>
          ) : (
            <span />
          )}
          {isAdmin ? (
            <div
              className="pointer-events-auto flex items-center rounded-none rounded-bl-lg border border-t-0 border-r-0 border-positive/40 bg-positive/15 px-3.5 py-3 text-positive"
              aria-label={t('badges.admin')}
            >
              <Icon name="shield" size="sm" />
            </div>
          ) : (
            <span />
          )}
        </div>
      )}

      {clientState === 'NO_LOBBY' && (
        <MenuLayout title={t('invalidLobby.title')} subtitle={t('invalidLobby.subtitle')}>
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

          <Divider>{t('sections.redirect')}</Divider>
          <div className="flex flex-col gap-2">
            <Link to="/" className={LINK_BUTTON_CLASS}>
              <span className={LINK_ICON_CLASS}>
                <Icon name="arrow left" size="sm" className="btn-ico" />
              </span>
              {t('buttons.home')}
            </Link>
            <a
              href="https://github.com/meshiest/outofcontext/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_BUTTON_CLASS}
            >
              <span className={LINK_ICON_CLASS}>
                <Icon name="bug" size="sm" className="btn-ico" />
              </span>
              {t('buttons.bugReport')}
            </a>
          </div>
        </MenuLayout>
      )}

      {clientState === 'NAME_ENTRY' && <NameEntry />}
      {clientState === 'WAITING' && lobbyInfo && routeCode && (
        <LobbyWaiting lobbyInfo={lobbyInfo} playerId={playerId} code={routeCode} />
      )}
      {clientState === 'PLAYING' && lobbyInfo && (
        <LobbyPlaying lobbyInfo={lobbyInfo} playerId={playerId} />
      )}

      {showOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-scrim">
          <Loader size="lg" label={t('loading')} />
        </div>
      )}

      <JoinLobbyModal open={showJoin} onClose={() => setShowJoin(false)} />
    </PageWrapper>
  );
}
