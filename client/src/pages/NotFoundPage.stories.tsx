import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import '@/i18n';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { NotFoundPage } from './NotFoundPage';

function StoryProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </PreferencesProvider>
  );
}

const meta = {
  title: 'Pages/NotFoundPage',
  component: NotFoundPage,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
} satisfies Meta<typeof NotFoundPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
