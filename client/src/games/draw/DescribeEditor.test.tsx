import '@/test/canvasMock';
import '@/i18n';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DescribeEditor } from './DescribeEditor';

const getTextarea = () => screen.getByRole('textbox');
const getSubmit = () => screen.getByRole('button', { name: 'Describe' });

describe('DescribeEditor', () => {
  it('disables submit when empty and enables it with valid text', () => {
    render(<DescribeEditor isInitial onSubmit={vi.fn()} />);
    expect(getSubmit()).toBeDisabled();
    fireEvent.change(getTextarea(), { target: { value: 'a dragon on roller skates' } });
    expect(getSubmit()).toBeEnabled();
  });

  it('disables submit when the text exceeds 256 characters', () => {
    render(<DescribeEditor isInitial onSubmit={vi.fn()} />);
    fireEvent.change(getTextarea(), { target: { value: 'x'.repeat(257) } });
    expect(getSubmit()).toBeDisabled();
  });

  it('calls onSubmit with the text and clears the input', () => {
    const onSubmit = vi.fn();
    render(<DescribeEditor isInitial onSubmit={onSubmit} />);
    fireEvent.change(getTextarea(), { target: { value: 'a haunted teapot' } });
    fireEvent.click(getSubmit());
    expect(onSubmit).toHaveBeenCalledWith('a haunted teapot');
    expect(getTextarea()).toHaveValue('');
  });

  it('shows the initial prompt when isInitial and the describe prompt otherwise', () => {
    const { rerender } = render(<DescribeEditor isInitial onSubmit={vi.fn()} />);
    expect(screen.getByText('What Should be Drawn?')).toBeInTheDocument();
    rerender(<DescribeEditor isInitial={false} onSubmit={vi.fn()} />);
    expect(screen.getByText('The last player drew...')).toBeInTheDocument();
  });
});
