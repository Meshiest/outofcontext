/** @vitest-environment jsdom */
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect } from 'vitest';
import { Accordion, AccordionItem } from './Accordion';

afterEach(cleanup);

function panelFor(button: HTMLElement): HTMLElement {
  const id = button.getAttribute('aria-controls');
  const panel = id ? document.getElementById(id) : null;
  if (!panel) throw new Error('panel not found for button');
  return panel;
}

describe('Accordion', () => {
  it('wires aria-expanded / aria-controls between header and panel', () => {
    render(
      <Accordion>
        <AccordionItem title="Section 1">Body one</AccordionItem>
      </Accordion>,
    );
    const button = screen.getByRole('button', { name: 'Section 1' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const panel = panelFor(button);
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-labelledby')).toBe(button.id);
    expect(panel).toHaveAttribute('inert');
  });

  it('toggles a section open and closed on click', async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem title="Section 1">Body one</AccordionItem>
      </Accordion>,
    );
    const button = screen.getByRole('button', { name: 'Section 1' });
    const panel = panelFor(button);

    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel).not.toHaveAttribute('inert');

    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel).toHaveAttribute('inert');
  });

  it('closes the other section in exclusive mode', async () => {
    const user = userEvent.setup();
    render(
      <Accordion exclusive>
        <AccordionItem title="First">Body one</AccordionItem>
        <AccordionItem title="Second">Body two</AccordionItem>
      </Accordion>,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });

    await user.click(first);
    expect(first.getAttribute('aria-expanded')).toBe('true');

    await user.click(second);
    expect(second.getAttribute('aria-expanded')).toBe('true');
    expect(first.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps multiple sections open by default (non-exclusive)', async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem title="First">Body one</AccordionItem>
        <AccordionItem title="Second">Body two</AccordionItem>
      </Accordion>,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });

    await user.click(first);
    await user.click(second);
    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });

  it('honours defaultOpen on the Accordion', () => {
    render(
      <Accordion defaultOpen={1}>
        <AccordionItem title="First">Body one</AccordionItem>
        <AccordionItem title="Second">Body two</AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button', { name: 'First' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
    expect(screen.getByRole('button', { name: 'Second' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('honours defaultOpen on a child item', () => {
    render(
      <Accordion>
        <AccordionItem title="First" defaultOpen>
          Body one
        </AccordionItem>
        <AccordionItem title="Second">Body two</AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button', { name: 'First' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('moves focus between headers with arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem title="First">Body one</AccordionItem>
        <AccordionItem title="Second">Body two</AccordionItem>
        <AccordionItem title="Third">Body three</AccordionItem>
      </Accordion>,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const second = screen.getByRole('button', { name: 'Second' });
    const third = screen.getByRole('button', { name: 'Third' });

    first.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(third);

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(first);
  });

  it('supports controlled open + onToggle', async () => {
    const user = userEvent.setup();
    const calls: number[] = [];
    render(
      <Accordion open={[0]} onToggle={(i) => calls.push(i)}>
        <AccordionItem title="First">Body one</AccordionItem>
        <AccordionItem title="Second">Body two</AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button', { name: 'First' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Second' }));
    expect(calls).toEqual([1]);
    // Controlled: state does not change until the parent updates `open`.
    expect(screen.getByRole('button', { name: 'Second' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });
});
