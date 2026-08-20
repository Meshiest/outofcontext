import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

// PageWrapper pins a SettingsPanel (needs PreferencesProvider + audio assets) below every page;
// stub it to a passthrough so these tests exercise only the NotFound content.
vi.mock('@/components/widgets/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { NotFoundPage } from './NotFoundPage';

afterEach(cleanup);

function renderPage() {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('renders the title and subtitle', () => {
    renderPage();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('It appears this page does not exist!')).toBeInTheDocument();
  });

  it('links Home to /', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('links Bug Report to the external issues page in a new tab', () => {
    renderPage();
    const bug = screen.getByRole('link', { name: 'Bug Report' });
    expect(bug).toHaveAttribute('href', 'https://github.com/meshiest/outofcontext/issues');
    expect(bug).toHaveAttribute('target', '_blank');
    expect(bug).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
