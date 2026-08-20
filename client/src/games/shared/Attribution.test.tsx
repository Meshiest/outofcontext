import '@/i18n';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Attribution } from './Attribution';

describe('Attribution', () => {
  // Story and Comic each hardcoded their own dash and both left out the space, so the credit read
  // "-Alice" in two of the four games that show one. Matched loosely on the dash so a translation
  // is free to use different punctuation - the separating space is what is being pinned.
  it('separates the dash from the name with a space', () => {
    const { container } = render(<Attribution name="Alice" />);
    expect(container.textContent).toMatch(/^\S+ Alice$/);
  });

  it('keeps a joined multi-author credit intact', () => {
    const { container } = render(<Attribution name="Alice, Bob, Carol" />);
    expect(container.textContent).toMatch(/^\S+ Alice, Bob, Carol$/);
  });
});
