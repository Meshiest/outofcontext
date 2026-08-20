import '@/test/canvasMock';
import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrawChainDisplay } from './DrawChainDisplay';
import type { DrawEntry } from './types';

/** Any PNG data URL: these tests only check it reaches the component. */
const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const nameTable = { p1: 'Ada', p2: 'Grace', p3: 'Alan' };

describe('DrawChainDisplay', () => {
  it('shows the Journey summary when the chain length is odd', () => {
    const entries: DrawEntry[] = [
      { link: { type: 'desc', data: 'a cat' }, editor: 'p1' },
      { link: { type: 'image', data: IMAGE }, editor: 'p2' },
      { link: { type: 'desc', data: 'a dog' }, editor: 'p3' },
    ];
    render(<DrawChainDisplay entries={entries} nameTable={nameTable} />);
    expect(screen.getByText('Journey')).toBeInTheDocument();
  });

  it('hides the Journey summary when the chain length is even', () => {
    const entries: DrawEntry[] = [
      { link: { type: 'desc', data: 'a cat' }, editor: 'p1' },
      { link: { type: 'image', data: IMAGE }, editor: 'p2' },
    ];
    render(<DrawChainDisplay entries={entries} nameTable={nameTable} />);
    expect(screen.queryByText('Journey')).toBeNull();
  });

  it('attributes each entry to its author name', () => {
    const entries: DrawEntry[] = [{ link: { type: 'desc', data: 'a cat' }, editor: 'p1' }];
    render(<DrawChainDisplay entries={entries} nameTable={nameTable} />);
    expect(screen.getByText(/Ada$/)).toBeInTheDocument();
  });
});
