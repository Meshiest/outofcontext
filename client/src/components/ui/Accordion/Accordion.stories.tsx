import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem } from './Accordion';

const meta = {
  title: 'Overlay & Feedback/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    exclusive: { control: 'boolean' },
    styled: { control: 'boolean' },
  },
  // Real items are supplied by each story's `render`; this satisfies the
  // required `children` prop at the type level (JSX children override it).
  args: { children: null },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: { styled: true },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem title="More Info">
        Raconteur is a collaborative writing game. Each player adds a line to a story they can only
        partly see.
      </AccordionItem>
    </Accordion>
  ),
};

export const ExclusiveMultiple: Story = {
  args: { styled: true, exclusive: true },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem title="More Info">
        Only one section can be open at a time in exclusive mode.
      </AccordionItem>
      <AccordionItem title="How to Play">
        Write a line, pass it on, and repeat until every player has contributed.
      </AccordionItem>
      <AccordionItem title="Configuration">
        Adjust the number of rounds and whether context lines are shown.
      </AccordionItem>
    </Accordion>
  ),
};

export const MultiOpen: Story = {
  args: { styled: true },
  render: (args) => (
    <Accordion {...args} defaultOpen={[0, 2]}>
      <AccordionItem title="Section One">Open on load.</AccordionItem>
      <AccordionItem title="Section Two">Closed on load.</AccordionItem>
      <AccordionItem title="Section Three">Open on load.</AccordionItem>
    </Accordion>
  ),
};

export const Unstyled: Story = {
  args: { styled: false },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem title="More Info">
        Without the styled treatment, sections use a simple divider rule.
      </AccordionItem>
      <AccordionItem title="How to Play">Plain, borderless layout.</AccordionItem>
    </Accordion>
  ),
};

export const GameInfoExample: Story = {
  args: { styled: true, exclusive: true },
  render: (args) => (
    <div className="max-w-sm">
      <h4 className="mb-2">Redacted</h4>
      <Accordion {...args}>
        <AccordionItem title="More Info" defaultOpen>
          Write a sentence, watch the next player black out words, then try to repair the meaning.
        </AccordionItem>
        <AccordionItem title="How to Play">
          Three phases per round: write, tamper, repair.
        </AccordionItem>
        <AccordionItem title="Configuration">4 to 256 players. 5 to 10 minutes.</AccordionItem>
      </Accordion>
    </div>
  ),
};
