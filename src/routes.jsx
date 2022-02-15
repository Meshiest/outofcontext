import { Route, Routes } from 'react-router';
import { App } from './App.jsx';
import { Home } from './home/Home.jsx';

const Lobby = () => 'Lobby';
const Games = () => 'Games';
const NotFound = () => 'NotFound';

export const Router = () => (
  <Routes>
    <Route path="/" element={<App />}>
      <Route index element={<Home />} />
      <Route path="lobby/:code?" element={<Lobby />} />
      <Route path="games/:name?" element={<Games />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);
