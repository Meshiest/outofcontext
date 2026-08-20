import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { useRocketCrab } from '@/hooks/useRocketCrab';

function wrapperFor(entry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(MemoryRouter, { initialEntries: [entry] }, children);
  };
}

function run(entry: string) {
  return renderHook(() => useRocketCrab(), { wrapper: wrapperFor(entry) }).result.current;
}

describe('useRocketCrab', () => {
  it('parses name and host flag when rocketcrab=true', () => {
    expect(run('/?rocketcrab=true&name=TestUser&ishost=true')).toEqual({
      name: 'TestUser',
      isHost: true,
    });
  });

  it('defaults an empty name to Player and host to false', () => {
    expect(run('/?rocketcrab=true&name=&ishost=false')).toEqual({
      name: 'Player',
      isHost: false,
    });
  });

  it('truncates a long name to 15 characters', () => {
    const result = run('/?rocketcrab=true&name=VeryLongPlayerNameHere');
    expect(result?.name).toBe('VeryLongPlayerN');
    expect(result?.name.length).toBe(15);
  });

  it('strips zero-width characters from the name', () => {
    const zw = String.fromCharCode(0x200b);
    const raw = encodeURIComponent(`a${zw}b${zw}c`);
    expect(run(`/?rocketcrab=true&name=${raw}`)?.name).toBe('abc');
  });

  it('returns null without the rocketcrab param', () => {
    expect(run('/?name=TestUser')).toBeNull();
  });

  it('returns null when rocketcrab is not exactly "true"', () => {
    expect(run('/?rocketcrab=false&name=TestUser')).toBeNull();
  });
});
