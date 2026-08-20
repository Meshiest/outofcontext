import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { MenuLayout } from './MenuLayout';
import { PageWrapper } from './PageWrapper';

const meta = {
  title: 'Widgets/PageWrapper',
  component: PageWrapper,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <PreferencesProvider>
        <Story />
      </PreferencesProvider>
    ),
  ],
} satisfies Meta<typeof PageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithContent: Story = {
  args: {
    children: (
      <MenuLayout title="Out Of Context" subtitle="Party games with your friends">
        <p>Sample page content sits above the settings panel.</p>
      </MenuLayout>
    ),
  },
};
