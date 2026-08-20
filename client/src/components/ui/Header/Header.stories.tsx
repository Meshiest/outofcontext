import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header, HeaderSubheader } from './Header';
import { Icon } from '@/components/ui/Icon/Icon';

const meta = {
  title: 'Layout/Header',
  component: Header,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Levels: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Header as="h1">Heading level 1</Header>
      <Header as="h2">Heading level 2</Header>
      <Header as="h3">Heading level 3</Header>
      <Header as="h4">Heading level 4</Header>
      <Header as="h5">Heading level 5</Header>
      <Header as="h6">Heading level 6</Header>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Header as="h2" icon={<Icon name="pencil" />}>
      Write the first line
    </Header>
  ),
};

export const WithSubheader: Story = {
  render: () => (
    <div>
      <Header as="h3" icon={<Icon name="paint brush" />}>
        Dilettante
      </Header>
      <HeaderSubheader>You must draw this:</HeaderSubheader>
    </div>
  ),
};
