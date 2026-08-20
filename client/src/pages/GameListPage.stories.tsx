import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { MemoryRouter } from 'react-router';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { GameListPage } from './GameListPage';

/**
 * The full game catalogue page: MenuLayout heading, a Redirect/Home section, and a GameInfoCard for
 * every non-hidden game (real gameInfo data). Wrapped in a router (for the Home link) and the
 * preferences provider (the PageWrapper's settings panel reads it).
 */
const meta = {
  title: 'Pages/GameListPage',
  component: GameListPage,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <PreferencesProvider>
          <Story />
        </PreferencesProvider>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof GameListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
