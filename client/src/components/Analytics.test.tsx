// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const h = vi.hoisted(() => ({ initAnalytics: vi.fn(), logPageView: vi.fn() }));

vi.mock('@/lib/analytics', () => ({
  initAnalytics: h.initAnalytics,
  logPageView: h.logPageView,
}));

import { Analytics } from './Analytics';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Analytics', () => {
  it('initializes gtag once and logs a page_view for the current route', () => {
    render(
      <MemoryRouter initialEntries={['/games']}>
        <Analytics />
      </MemoryRouter>,
    );
    expect(h.initAnalytics).toHaveBeenCalledTimes(1);
    expect(h.logPageView).toHaveBeenCalledWith('/games');
  });

  it('renders nothing', () => {
    const { container } = render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
