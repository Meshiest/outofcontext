import {
  Component,
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { GameWaiting } from './shared/GameWaiting';

// Lazy game entrypoints: only the chunk for the game actually being played is downloaded.
const GAME_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  story: lazy(() => import('./story/StoryGame')),
  comic: lazy(() => import('./comic/ComicGame')),
  draw: lazy(() => import('./draw/DrawGame')),
  redacted: lazy(() => import('./redacted/RedactedGame')),
  recipe: lazy(() => import('./recipe/RecipeGame')),
  assassin: lazy(() => import('./assassin/AssassinGame')),
};

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Catches a failed lazy import (e.g. a stale chunk after a deploy) and shows the waiting fallback
 * instead of crashing the whole app. Error boundaries still require a class component in React 19.
 */
class GameErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export interface GameRendererProps {
  game: string;
}

/**
 * Maps a game name to its lazily-loaded component, rendered inside a Suspense boundary (loading
 * fallback) and an error boundary. An unknown game renders nothing.
 */
export function GameRenderer({ game }: GameRendererProps) {
  const { t } = useTranslation('game-common');
  const GameComponent = GAME_COMPONENTS[game];
  if (!GameComponent) return null;

  const fallback = <GameWaiting message={t('loading')} />;
  // key={game} remounts the boundary when the game changes, so a `hasError` from one game's failed
  // chunk load does not latch and suppress a different (or retried) game for the rest of the session.
  return (
    <GameErrorBoundary key={game} fallback={fallback}>
      <Suspense fallback={fallback}>
        <GameComponent />
      </Suspense>
    </GameErrorBoundary>
  );
}
