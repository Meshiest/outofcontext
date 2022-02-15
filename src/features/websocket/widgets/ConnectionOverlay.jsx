import { memo } from 'react';
import { Dimmer, Loader } from 'semantic-ui-react';
import { useDarkMode } from '../../darkMode/hooks.jsx';
import { useDisconnected } from '../hooks.jsx';

const OverlayInner = () => {
  const isDisconnected = useDisconnected();
  const isDark = useDarkMode();

  return (
    <Dimmer active={isDisconnected} style={{ position: 'fixed' }}>
      <Loader active inverted={isDark}>
        Lost Connection to Server
      </Loader>
    </Dimmer>
  );
};

export const ConnectionOverlay = memo(OverlayInner);
