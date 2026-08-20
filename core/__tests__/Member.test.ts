import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Member } from '../Member';
import type { ServerEvent } from '../Member';

describe('Member', () => {
  it('assigns a unique id and registers in the lookup', () => {
    const a = new Member();
    const b = new Member();
    expect(a.id).not.toBe(b.id);
    expect(Member.byId(a.id)).toBe(a);
    expect(Member.byId(b.id)).toBe(b);
    expect(a.connected).toBe(true);
  });

  it('honors a provided id and getOrCreate reuses it', () => {
    const m = new Member('member-fixed');
    expect(m.id).toBe('member-fixed');
    expect(Member.getOrCreate('member-fixed')).toBe(m);
    const fresh = Member.getOrCreate();
    expect(fresh).not.toBe(m);
  });

  it('interact updates the activity timestamp', () => {
    const m = new Member();
    m.activity = 0;
    m.interact();
    expect(m.activity).toBeGreaterThan(0);
  });

  it('inActiveLobby is true only when the lobby has more than one member', () => {
    const m = new Member();
    expect(m.inActiveLobby()).toBe(false);
    m.lobby = { members: [1] } as never;
    expect(m.inActiveLobby()).toBe(false);
    m.lobby = { members: [1, 2] } as never;
    expect(m.inActiveLobby()).toBe(true);
  });

  it('isAdmin is true only when the lobby admin equals this id', () => {
    const m = new Member('admin-1');
    expect(m.isAdmin()).toBe(false);
    m.lobby = { admin: 'someone-else' } as never;
    expect(m.isAdmin()).toBe(false);
    m.lobby = { admin: 'admin-1' } as never;
    expect(m.isAdmin()).toBe(true);
  });

  it('removePlayer removes from the registry', () => {
    const m = new Member();
    const id = m.id;
    Member.removePlayer(m);
    expect(Member.byId(id)).toBeUndefined();
    expect(m.removed).toBe(true);
  });

  it('cullInactive disconnects a member idle > 1h and not in an active lobby', () => {
    const m = new Member();
    m.activity = Date.now() - (61 * 60 * 1000);
    Member.cullInactive();
    expect(Member.byId(m.id)).toBeUndefined();
    expect(m.connected).toBe(false);
  });

  it('cullInactive disconnects a member idle > 4h even in an active lobby', () => {
    const m = new Member();
    m.lobby = { members: [1, 2] } as never; // inActiveLobby -> true
    m.activity = Date.now() - (5 * 60 * 60 * 1000);
    Member.cullInactive();
    expect(Member.byId(m.id)).toBeUndefined();
  });

  it('cullInactive keeps recently active members', () => {
    const m = new Member();
    m.activity = Date.now();
    Member.cullInactive();
    expect(Member.byId(m.id)).toBe(m);
    expect(m.connected).toBe(true);
  });

  it('send/subscribe streams events until disconnect', async () => {
    const m = new Member();
    const it = m.subscribe();

    // Each next() starts/resumes the generator (registering its listener) before we send.
    const p1 = it.next();
    m.send('a', 1);
    expect((await p1).value).toEqual<ServerEvent>({ event: 'a', args: [1] });

    const p2 = it.next();
    m.send('b', 2, 3);
    expect((await p2).value).toEqual<ServerEvent>({ event: 'b', args: [2, 3] });

    const p3 = it.next();
    m.disconnect();
    expect((await p3).done).toBe(true);
    expect(m.connected).toBe(false);
  });
});

describe('Member reconnection lifecycle (refcount + grace reap)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers(); // drop any pending reap so it cannot bleed into the next test
    vi.useRealTimers();
  });

  it('reaps a member only after the grace window once its last stream closes', async () => {
    const reaper = vi.fn();
    Member.setReaper(reaper);
    const m = new Member('reap-solo');
    const ac = new AbortController();
    const gen = m.subscribe(ac.signal);
    const p = gen.next(); // openStream runs synchronously on first next()
    expect(m.connected).toBe(true);
    ac.abort();
    await p;
    expect(m.connected).toBe(false);
    expect(reaper).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(Member.reapGraceMs);
    expect(reaper).toHaveBeenCalledWith(m);
  });

  it('cancels the reap when a stream reopens within the grace window (reconnect)', async () => {
    const reaper = vi.fn();
    Member.setReaper(reaper);
    const m = new Member('reap-reconnect');
    const ac1 = new AbortController();
    const g1 = m.subscribe(ac1.signal);
    const p1 = g1.next();
    ac1.abort();
    await p1; // last stream closed -> reap scheduled
    await vi.advanceTimersByTimeAsync(Member.reapGraceMs / 2); // partway through the grace window
    const ac2 = new AbortController();
    const g2 = m.subscribe(ac2.signal);
    const p2 = g2.next(); // reconnect -> cancels the pending reap
    expect(m.connected).toBe(true);
    await vi.advanceTimersByTimeAsync(Member.reapGraceMs); // well past the original deadline
    expect(reaper).not.toHaveBeenCalled();
    ac2.abort();
    await p2;
  });

  it('does not reap while another concurrent stream is still open (refcount)', async () => {
    const reaper = vi.fn();
    Member.setReaper(reaper);
    const m = new Member('reap-refcount');
    const acA = new AbortController();
    const gA = m.subscribe(acA.signal);
    const pA = gA.next();
    const acB = new AbortController();
    const gB = m.subscribe(acB.signal);
    const pB = gB.next();
    acA.abort();
    await pA; // one stream closed, one still open
    await vi.advanceTimersByTimeAsync(Member.reapGraceMs * 2);
    expect(reaper).not.toHaveBeenCalled();
    expect(m.connected).toBe(true);
    acB.abort();
    await pB; // last stream closed -> reap scheduled
    await vi.advanceTimersByTimeAsync(Member.reapGraceMs);
    expect(reaper).toHaveBeenCalledWith(m);
  });
});
