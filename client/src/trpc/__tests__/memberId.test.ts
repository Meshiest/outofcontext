import { describe, it, expect, beforeEach } from 'vitest';
import { getMemberId, MEMBER_ID_KEY } from '@/trpc/memberId';
import { installLocalStorageMock, installSessionStorageMock } from '@/test/localStorageMock';

describe('getMemberId', () => {
  beforeEach(() => {
    installSessionStorageMock();
    installLocalStorageMock();
  });

  it('mints and persists a fresh id when none exists', () => {
    expect(sessionStorage.getItem(MEMBER_ID_KEY)).toBeNull();
    const id = getMemberId();
    expect(id).toBeTruthy();
    expect(sessionStorage.getItem(MEMBER_ID_KEY)).toBe(id);
  });

  it('returns the same id on subsequent calls', () => {
    const first = getMemberId();
    const second = getMemberId();
    expect(second).toBe(first);
  });

  it('reuses a pre-existing persisted id', () => {
    sessionStorage.setItem(MEMBER_ID_KEY, 'preset-id-123');
    expect(getMemberId()).toBe('preset-id-123');
  });

  it('gives each tab its own id', () => {
    // Two tabs of one browser must be two distinct members: a shared id (localStorage is shared
    // between tabs) resolves both to a single server-side Member, so opening a second tab clobbers
    // the first tab's lobby membership. A fresh sessionStorage models the new tab.
    const firstTab = getMemberId();
    installSessionStorageMock();
    const secondTab = getMemberId();
    expect(secondTab).not.toBe(firstTab);
  });

  it('does not read or write localStorage (which is shared between tabs)', () => {
    getMemberId();
    expect(localStorage.getItem(MEMBER_ID_KEY)).toBeNull();
  });
});
