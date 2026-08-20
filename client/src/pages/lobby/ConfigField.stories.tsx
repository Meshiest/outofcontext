import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import type { ConfigFieldDef } from '@shared/types';
import { ConfigField } from './ConfigField';

const intCfg: ConfigFieldDef = {
  type: 'int',
  min: 2,
  max: 256,
  defaults: '#numPlayers',
};

const boolCfg: ConfigFieldDef = {
  type: 'bool',
  defaults: 'false',
};

const listCfg: ConfigFieldDef = {
  type: 'list',
  defaults: 'regular',
  options: [
    { name: 'regular', value: 1 },
    { name: 'two', value: 2 },
    { name: 'three', value: 3 },
  ],
};

const meta = {
  title: 'Pages/Lobby/ConfigField',
  component: ConfigField,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
  args: {
    gameId: 'story',
    name: 'numStories',
    cfg: intCfg,
    rawValue: 3,
    playerCount: 4,
    onChange: () => {},
  },
} satisfies Meta<typeof ConfigField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IntNormal: Story = {};

export const IntNumPlayersActive: Story = {
  args: { rawValue: '#numPlayers', playerCount: 4 },
};

export const IntOutOfRange: Story = {
  // #numPlayers with too few players resolves below min -> minimum warning.
  args: { rawValue: '#numPlayers', playerCount: 0 },
};

export const Bool: Story = {
  args: { name: 'anonymous', cfg: boolCfg, rawValue: 'false' },
};

export const List: Story = {
  args: { name: 'contextLen', cfg: listCfg, rawValue: 'regular' },
};
