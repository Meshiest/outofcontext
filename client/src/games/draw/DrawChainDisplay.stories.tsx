import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { makeSampleDrawing } from '@/components/widgets/doodle/sampleDrawing';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { DrawChainDisplay } from './DrawChainDisplay';
import type { DrawEntry } from './types';

const nameTable = { p1: 'Ada', p2: 'Grace', p3: 'Alan' };

const oddChain: DrawEntry[] = [
  { link: { type: 'desc', data: 'A cat riding a bicycle' }, editor: 'p1' },
  { link: { type: 'image', data: makeSampleDrawing() }, editor: 'p2' },
  { link: { type: 'desc', data: 'A dog on a unicycle, somehow' }, editor: 'p3' },
];

const evenChain: DrawEntry[] = [
  { link: { type: 'desc', data: 'A lighthouse at dusk' }, editor: 'p1' },
  { link: { type: 'image', data: makeSampleDrawing() }, editor: 'p2' },
];

// Was an invented `max-w-md` (448px), a width the game column never has. Framed at the real
// measure instead (see storybookFrames), which the chain's drawings scale to.
const meta = {
  title: 'Games/Draw/DrawChainDisplay',
  component: DrawChainDisplay,
  parameters: { layout: 'padded' },
  args: { nameTable },
  decorators: [desktopGameColumn],
} satisfies Meta<typeof DrawChainDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Odd-length chain: starts and ends with a description, so the Journey summary appears. */
export const OddWithSummary: Story = {
  args: { entries: oddChain },
};

/** Even-length chain: no Journey summary. */
export const EvenNoSummary: Story = {
  args: { entries: evenChain },
};

/** The odd-length chain at the phone measure, where the Journey summary wraps onto more lines. */
export const Mobile: Story = {
  args: { entries: oddChain },
  decorators: [mobileGameColumn],
};
