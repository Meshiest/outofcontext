import '@/i18n';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import i18n from '@/i18n';
import { AppWordmark } from './AppWordmark';

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('en');
});

/** Per language: the full title, and the word that carries the ink block. */
const TITLES: Record<string, { full: string; marked: string }> = {
  en: { full: 'Out of Context', marked: 'Context' },
  de: { full: 'Ohne Kontext', marked: 'Kontext' },
  es: { full: 'Fuera de Contexto', marked: 'Contexto' },
  fr: { full: 'Hors Contexte', marked: 'Contexte' },
};

describe('AppWordmark', () => {
  it('puts the ink block on the word, not the whole title', () => {
    const { container } = render(<AppWordmark />);
    const ink = container.querySelector('.bg-ink');
    expect(ink).not.toBeNull();
    expect(ink).toHaveTextContent('Context');
    // The rest of the title must sit outside the block, or the joke is just a highlighted heading.
    expect(container.textContent).toBe('Out of Context');
    expect(ink!.textContent).not.toContain('Out of');
  });

  it.each(Object.keys(TITLES))('marks the right word in %s, and only that word', async (lng) => {
    await i18n.changeLanguage(lng);
    const { container } = render(<AppWordmark />);
    // Which word is inked is a translation decision - the locale marks it with <ink> - and the
    // surrounding words must survive in order, which is what a prefix+suffix split would risk.
    expect(container.querySelector('.bg-ink')).toHaveTextContent(TITLES[lng].marked);
    expect(container.textContent).toBe(TITLES[lng].full);
  });
});
