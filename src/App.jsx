import { Outlet, useLocation } from 'react-router';
import { useRocketCrabDetector } from './features/rocketcrab/hooks.jsx';
import { useSocketMonitor } from './features/websocket/hooks.jsx';
import { ConnectionOverlay } from './features/websocket/widgets/ConnectionOverlay.jsx';

export const App = () => {
  useRocketCrabDetector();
  useSocketMonitor();

  return (
    <>
      <ConnectionOverlay />
      <Outlet />
    </>
  );
};
