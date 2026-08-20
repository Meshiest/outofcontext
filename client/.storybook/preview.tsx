import type { Preview, Decorator } from '@storybook/react-vite';
import { useEffect } from 'react';
// Activate Tailwind + theme tokens (and Font Awesome) in every story.
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../src/index.css';
// Initialise i18n. Stories that render real components render real copy, and anything using t() or
// <Trans> renders blank without this - which is a silently empty specimen, not an obvious error.
import '../src/i18n';

// Render every story on the theme's paper ground, and let the toolbar flip light/dark by
// toggling `html.dark` (the same class the app uses). Without this, stories float on a white
// canvas in system fonts and look nothing like the theme.
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'light';
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return (
    <div className="bg-bg text-text font-sans" style={{ minHeight: '100vh', padding: '2rem' }}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    options: {
      // Pin the Gallery overview to the top of the sidebar.
      storySort: { order: ['Gallery', '*'] },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Light / dark theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
