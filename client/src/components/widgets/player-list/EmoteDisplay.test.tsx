import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmoteDisplay } from './EmoteDisplay';

describe('EmoteDisplay', () => {
  it('renders the emote icon', () => {
    const { container } = render(<EmoteDisplay emote="smile" />);
    expect(container.querySelector('.fa-face-smile')).toBeInTheDocument();
    expect(container.querySelector('.ooc-emote')).toBeInTheDocument();
  });

  it('applies the exiting class when exiting', () => {
    const { container } = render(<EmoteDisplay emote="smile" exiting />);
    expect(container.querySelector('.ooc-emote--exiting')).toBeInTheDocument();
  });
});
