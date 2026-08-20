import { Routes, Route } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { GameListPage } from '@/pages/GameListPage';
import { LobbyPage } from '@/pages/lobby/LobbyPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/** App route table. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/games" element={<GameListPage />} />
      <Route path="/lobby/:code" element={<LobbyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
