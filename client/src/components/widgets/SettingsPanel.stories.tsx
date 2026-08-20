import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { SettingsPanel } from './SettingsPanel';

/** Live preferences panel (dark mode, turn sound, streamer mode). Expand the accordion to see it. */
const meta = {
  title: 'Widgets/SettingsPanel',
  component: SettingsPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <PreferencesProvider>
        <Story />
      </PreferencesProvider>
    ),
  ],
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
