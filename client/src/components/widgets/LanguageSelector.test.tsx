import '@/i18n';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '@/i18n';
import { LanguageSelector } from './LanguageSelector';

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('en');
});

describe('LanguageSelector', () => {
  it('labels each option in its own language, not the active one', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);
    await user.click(screen.getByRole('combobox'));

    // Someone stuck in a language they cannot read has to recognise their own in the list.
    for (const code of ['en', 'de', 'es', 'fr']) {
      const native = i18n.getFixedT(code, 'common')('language.native');
      expect(screen.getByRole('option', { name: native })).toBeInTheDocument();
    }
  });

  it('switches the interface language on select', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      screen.getByRole('option', { name: i18n.getFixedT('de', 'common')('language.native') }),
    );
    expect(i18n.resolvedLanguage).toBe('de');
  });
});
