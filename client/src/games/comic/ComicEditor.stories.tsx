import type { Meta, StoryObj } from '@storybook/react-vite';
import '@/i18n';
import { makeSampleDrawing } from '@/components/widgets/doodle/sampleDrawing';
import { desktopGameColumn, mobileGameColumn } from '@/games/storybookFrames';
import { ComicEditor } from './ComicEditor';

const sampleDrawing = makeSampleDrawing();

// Framed at the real game-column measure (see storybookFrames). The drawing canvas sizes itself to
// the column, so an unframed story hands the artist a canvas the app never gives them.
const meta = {
  title: 'Games/Comic/ComicEditor',
  component: ComicEditor,
  parameters: { layout: 'padded' },
  decorators: [desktopGameColumn],
  args: {
    link: [],
    isLastLink: false,
    enableCaptions: false,
    showCaptions: false,
    showDrawings: true,
    continuous: false,
    colors: false,
    onSubmit: () => {},
  },
} satisfies Meta<typeof ComicEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First drawing of a chain - no context, just "Draw the beginning!". */
export const FirstDrawing: Story = {};

/** Continuing from a previous artist's drawing (drawings-only mode). */
export const WithPreviousDrawing: Story = {
  args: {
    link: [{ drawing: sampleDrawing }],
  },
};

/** Comic mode: previous caption + drawing shown, and a caption field for this turn. */
export const WithCaptions: Story = {
  args: {
    enableCaptions: true,
    showCaptions: true,
    link: [{ drawing: sampleDrawing, caption: 'A dog on a skateboard' }],
  },
};

/** Continuous collab mode: connect your drawing to the bottom of the previous one. */
export const Continuous: Story = {
  args: {
    continuous: true,
    link: [{ drawing: sampleDrawing }],
  },
};

/** Final link - the prompt reads "Finish the sequence!". */
export const LastLink: Story = {
  args: {
    isLastLink: true,
    link: [{ drawing: sampleDrawing }],
  },
};

/** WithCaptions at the phone measure - the canvas and the toolbar under it get 343px to share. */
export const Mobile: Story = {
  args: WithCaptions.args,
  decorators: [mobileGameColumn],
};
