import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Stubbed so PageWrapper's own composition is verified in isolation; the real panel is exercised
// in SettingsPanel.test.
vi.mock('./SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel" />,
}));

import { PageWrapper } from './PageWrapper';

describe('PageWrapper', () => {
  it('renders its children', () => {
    render(
      <PageWrapper>
        <h1>Home</h1>
      </PageWrapper>,
    );
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders the SettingsPanel after the children', () => {
    render(
      <PageWrapper>
        <main data-testid="content">Body</main>
      </PageWrapper>,
    );
    const content = screen.getByTestId('content');
    const settings = screen.getByTestId('settings-panel');
    expect(settings).toBeInTheDocument();
    // Settings comes after the page content in document order.
    expect(
      content.compareDocumentPosition(settings) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
