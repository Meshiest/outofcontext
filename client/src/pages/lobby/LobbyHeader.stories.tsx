import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LobbyHeader } from './LobbyHeader';

// LobbyHeader reads streamer mode from PreferencesProvider (localStorage-backed). With streamer mode
// off (the default), the code + phonetic + copy/share buttons show; with it on it renders nothing
// (covered in LobbyHeader.test.tsx).
const meta = {
  title: 'Pages/Lobby/LobbyHeader',
  component: LobbyHeader,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <PreferencesProvider>
        <div className="w-[300px]">
          <Story />
        </div>
      </PreferencesProvider>
    ),
  ],
  args: { code: 'wxyz' },
} satisfies Meta<typeof LobbyHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CodeVisible: Story = {};
