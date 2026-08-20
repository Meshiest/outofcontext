import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Form } from './Form';
import { FormField } from './FormField';

describe('Form', () => {
  it('fires the submit handler when a submit button is pressed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <Form onSubmit={onSubmit}>
        <button type="submit">Go</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows a loading overlay and marks the form busy', () => {
    const { container } = render(
      <Form loading>
        <button type="submit">Go</button>
      </Form>,
    );
    const form = container.querySelector('form');
    expect(form).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.fa-spin')).toBeInTheDocument();
  });

  it('exposes a data-error hook when in error state', () => {
    const { container } = render(
      <Form error>
        <button type="submit">Go</button>
      </Form>,
    );
    expect(container.querySelector('form')).toHaveAttribute('data-error', 'true');
  });

  it('forwards ref to the native form', () => {
    const ref = createRef<HTMLFormElement>();
    render(
      <Form ref={ref}>
        <button type="submit">Go</button>
      </Form>,
    );
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });
});

describe('FormField', () => {
  it('renders the label and associates it with the child control', () => {
    render(
      <FormField label="Name">
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText('Name')).toBeInstanceOf(HTMLInputElement);
  });

  it('renders the error message and wires aria attributes on the child', () => {
    render(
      <FormField label="Lobby code" error="This lobby does not exist">
        <input />
      </FormField>,
    );
    const input = screen.getByLabelText('Lobby code');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('This lobby does not exist');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('keeps an explicit child id for label association', () => {
    render(
      <FormField label="Name" htmlFor="custom-id">
        <input id="custom-id" />
      </FormField>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('id', 'custom-id');
  });
});
