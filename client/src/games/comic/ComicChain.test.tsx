import '@/test/canvasMock';
import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComicChain } from './ComicChain';
import type { ComicEntry } from './types';

/** Any PNG data URL: these tests only check it reaches the component. */
const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const nameTable = { p1: 'Alice', p2: 'Bob' };

const entries: ComicEntry[] = [
  { link: { drawing: IMAGE, caption: 'a cat' }, editor: 'p1' },
  { link: { drawing: IMAGE, caption: 'a dog' }, editor: 'p2' },
];

describe('ComicChain', () => {
  it('standard mode: renders each entry caption, a drawing, and author attribution', () => {
    const { container } = render(
      <ComicChain entries={entries} continuous={false} enableCaptions nameTable={nameTable} />,
    );
    expect(screen.getByText('a cat')).toBeInTheDocument();
    expect(screen.getByText('a dog')).toBeInTheDocument();
    expect(screen.getByText(/Alice$/)).toBeInTheDocument();
    expect(screen.getByText(/Bob$/)).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(2);
  });

  it('standard mode: omits captions when captions are disabled', () => {
    render(
      <ComicChain
        entries={entries}
        continuous={false}
        enableCaptions={false}
        nameTable={nameTable}
      />,
    );
    expect(screen.queryByText('a cat')).toBeNull();
    expect(screen.getByText(/Alice$/)).toBeInTheDocument();
  });

  it('continuous mode: stacks drawings with author overlays and no captions', () => {
    const { container } = render(
      <ComicChain entries={entries} continuous enableCaptions nameTable={nameTable} />,
    );
    // Captions are never rendered in continuous mode, even when captions are enabled.
    expect(screen.queryByText('a cat')).toBeNull();
    expect(screen.queryByText('a dog')).toBeNull();
    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByText('Drawn by Alice')).toBeInTheDocument();
    expect(screen.getByText('Drawn by Bob')).toBeInTheDocument();
  });

  it('continuous mode: hides author overlays when the sequence is anonymous', () => {
    const anon: ComicEntry[] = [
      { link: { drawing: IMAGE }, editor: '' },
      { link: { drawing: IMAGE }, editor: '' },
    ];
    render(<ComicChain entries={anon} continuous enableCaptions={false} nameTable={nameTable} />);
    expect(screen.queryByText(/Drawn by/)).toBeNull();
  });
});
