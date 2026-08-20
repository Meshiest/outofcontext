import { describe, it, expect } from 'vitest';
import { reduceConnection, initialConnectionState, type ConnectionState } from '@/trpc/connection';

describe('reduceConnection', () => {
  it('starts disconnected=false before the first connect', () => {
    const s = reduceConnection(initialConnectionState, 'connecting');
    expect(s).toEqual({
      everConnected: false,
      connected: false,
      disconnected: false,
    });
  });

  it('marks connected once the stream is pending', () => {
    const s = reduceConnection(initialConnectionState, 'pending');
    expect(s.connected).toBe(true);
    expect(s.everConnected).toBe(true);
    expect(s.disconnected).toBe(false);
  });

  it('shows disconnected only after having connected at least once', () => {
    const connected = reduceConnection(initialConnectionState, 'pending');
    const dropped = reduceConnection(connected, 'connecting');
    expect(dropped.connected).toBe(false);
    expect(dropped.everConnected).toBe(true);
    expect(dropped.disconnected).toBe(true);
  });

  it('treats an error status as disconnected (after a prior connect)', () => {
    const connected = reduceConnection(initialConnectionState, 'pending');
    const errored = reduceConnection(connected, 'error');
    expect(errored.disconnected).toBe(true);
  });

  it('clears disconnected on reconnect', () => {
    let s: ConnectionState = reduceConnection(initialConnectionState, 'pending');
    s = reduceConnection(s, 'connecting');
    expect(s.disconnected).toBe(true);
    s = reduceConnection(s, 'pending');
    expect(s.connected).toBe(true);
    expect(s.disconnected).toBe(false);
  });

  it('is idempotent for a repeated status', () => {
    const a = reduceConnection(initialConnectionState, 'pending');
    const b = reduceConnection(a, 'pending');
    expect(b).toEqual(a);
  });
});
