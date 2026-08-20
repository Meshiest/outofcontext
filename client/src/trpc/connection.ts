// Connection state derived from a tRPC subscription's status. Kept as a pure reducer so the
// ConnectionOverlay logic is unit-testable without React.
//
// tRPC subscription status: 'idle' | 'connecting' | 'pending' | 'error'
//   - 'pending'    -> the SSE stream is open and receiving (we treat this as "connected")
//   - 'connecting' -> opening or (auto-)reconnecting
//   - 'error'      -> an unrecoverable error closed the stream
//
// `disconnected` only becomes true AFTER the first successful connect, so the very first connecting
// phase does not flash the "lost connection" overlay.

export type SubscriptionStatus = 'idle' | 'connecting' | 'pending' | 'error';

export interface ConnectionState {
  everConnected: boolean;
  connected: boolean;
  disconnected: boolean;
}

export const initialConnectionState: ConnectionState = {
  everConnected: false,
  connected: false,
  disconnected: false,
};

export function reduceConnection(
  state: ConnectionState,
  status: SubscriptionStatus,
): ConnectionState {
  const connected = status === 'pending';
  const everConnected = state.everConnected || connected;
  const disconnected = everConnected && !connected;
  return { everConnected, connected, disconnected };
}
