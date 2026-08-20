import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { cn } from '@/components/lib/cn';
import { LOBBY_COLUMN } from '@/pages/lobby/layout';
import { ReadOnlyDrawing } from './ReadOnlyDrawing';
import { makeSampleDrawing } from './sampleDrawing';

const meta = {
  title: 'Widgets/Doodle/ReadOnlyDrawing',
  component: ReadOnlyDrawing,
  // Fullscreen + `mx-auto` on the frame, rather than Storybook's centred layout. Every story sits
  // inside a full-height themed page, which leaves the centred layout shrink-wrapping that page
  // into a narrow scrolling strip with the white square off to one side of it. Giving the frame the
  // whole page width and centring the frame itself puts the drawing in the middle of the space it
  // is shown in.
  parameters: { layout: 'fullscreen' },
  // The results chains render a finished drawing rounded (see DrawChainDisplay), so the white
  // square reads as a framed drawing instead of a bleed - which is what makes framing judgeable.
  args: { className: 'rounded-lg' },
  decorators: [
    (Story) => (
      // The stacked lobby column - the width a finished drawing gets on a phone and in the results
      // list. The frame is square and the drawing fills it, so this width sets the whole specimen.
      <div className={cn('mx-auto', LOBBY_COLUMN)}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReadOnlyDrawing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Attributed drawing: the author chip fades to near-invisible after 2s and returns on hover. */
export const WithAuthor: Story = {
  args: { image: makeSampleDrawing(), author: 'Ada' },
};

/** No attribution - how a drawing renders mid-chain while the round is still running. */
export const WithoutAuthor: Story = {
  args: { image: makeSampleDrawing() },
};
