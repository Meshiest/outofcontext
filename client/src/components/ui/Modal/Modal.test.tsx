/** @vitest-environment jsdom */
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

afterEach(cleanup);

// jsdom (as of this project's version) does not implement HTMLDialogElement.showModal;
// the component falls back to toggling the `open` attribute, so assertions target that.

describe('Modal', () => {
  it('opens the dialog when open is true', () => {
    render(
      <Modal open title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('keeps the dialog closed when open is false', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <Modal open={false} ref={ref} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    expect(ref.current?.hasAttribute('open')).toBe(false);
  });

  it('transitions from closed to open via the open prop', () => {
    const ref = createRef<HTMLDialogElement>();
    const { rerender } = render(
      <Modal open={false} ref={ref} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    expect(ref.current?.hasAttribute('open')).toBe(false);
    rerender(
      <Modal open ref={ref} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    expect(ref.current?.hasAttribute('open')).toBe(true);
  });

  it('labels the dialog with its title', () => {
    render(
      <Modal open title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId as string)?.textContent).toBe('Join Lobby');
  });

  it('falls back to ariaLabel when no title is given', () => {
    render(
      <Modal open ariaLabel="Dialog">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.getAttribute('aria-label')).toBe('Dialog');
    expect(dialog.getAttribute('aria-labelledby')).toBeNull();
  });

  it('calls onClose on a backdrop click (mousedown + up both on the dialog)', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    fireEvent.mouseDown(dialog);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when the panel content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByText('Body'));
    fireEvent.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when a drag starts inside the panel and releases on the backdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    fireEvent.mouseDown(screen.getByText('Body'));
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on the native cancel event (Escape)', () => {
    const onClose = vi.fn();
    const ref = createRef<HTMLDialogElement>();
    render(
      <Modal open ref={ref} onClose={onClose} title="Join Lobby">
        <p>Body</p>
      </Modal>,
    );
    fireEvent(ref.current as HTMLDialogElement, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a labelled close button that calls onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Join Lobby" closeLabel="Close">
        <p>Body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
