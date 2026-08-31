import _ from 'lodash';
import { EventEmitter } from 'node:events';
import type { Lobby } from './Lobby.js';
import type { ServerEventName } from '@shared/events';
import type { Country } from './Metrics.js';

// 1 hour of inactivity and not in a game -> kick
const INACTIVE_DURATION = 60 * 60 * 1000;
// 4 hours of inactivity regardless -> kick
const REALLY_INACTIVE_DURATION = 4 * 60 * 60 * 1000;

// A single server->client push, streamed to the member's SSE subscription(s). The lobby/game write
// here and the subscription forwards it.
export interface ServerEvent {
  event: ServerEventName;
  args: unknown[];
}

const members: Member[] = [];
const byId = new Map<string, Member>();

export class Member {
  socketBus: EventEmitter;
  id: string;
  lobby: Lobby | undefined;
  name: string;
  color: number;
  lastEmote: number;
  activity: number;
  removed: boolean;
  connected: boolean;
  /** Cloudflare-resolved country, for labelling metrics. Never an IP - see core/Metrics.ts. */
  country: Country | undefined;
  // Number of open SSE streams (onInfo + onState). A stable-id member survives while any stream is
  // open; when the last one ends it is reaped only after a grace period (see reapGraceMs), so a
  // transient EventSource reconnect resumes the SAME member with its lobby intact instead of being
  // destroyed and re-created lobby-less.
  private activeStreams: number;
  private reapTimer: ReturnType<typeof setTimeout> | undefined;

  // Grace before a member with no open streams is reaped. Long enough to ride out a routine SSE
  // reconnect (proxy idle-timeout, wifi<->cellular, brief sleep), short enough that a truly-gone
  // player's seat clears promptly.
  static reapGraceMs = 20000;

  // Removes a reaped member from its lobby + the registry. Registered by the server entrypoint so
  // core/Member.ts need not import core/Lobby.ts at runtime (they reference each other).
  private static reaper: ((member: Member) => void) | undefined;
  static setReaper(fn: (member: Member) => void): void {
    Member.reaper = fn;
  }

  static removePlayer(member: Member): void {
    if (member.removed) return;
    member.removed = true;
    byId.delete(member.id);
    const index = members.indexOf(member);
    if (index < 0) return;
    members[index] = members[members.length - 1];
    members.pop();
  }

  static cullInactive(): void {
    const now = Date.now();
    for (let i = members.length - 1; i >= 0; --i) {
      const member = members[i];
      if (
        (member.activity + INACTIVE_DURATION < now && !member.inActiveLobby()) ||
        member.activity + REALLY_INACTIVE_DURATION < now
      ) {
        console.log(new Date(), '-- [afk] disconnected inactive user');
        if (member.connected) {
          // Order matters: send() is unbuffered, so this has to go out while the stream is still
          // attached. After disconnect() there is no subscriber and the event is dropped.
          member.send('member:kicked');
          member.disconnect();
        }
        // Reap through the same path the grace-window reap uses: the member has to leave their
        // LOBBY, not just the registry. Do NOT remove inline or set `removed` here - either one
        // strands a kicked member on lobby.members, so the lobby never reports empty, cullEmpty
        // never collects it, and the idle counts only ever climb.
        if (Member.reaper) Member.reaper(member);
        else Member.removePlayer(member);
      }
    }
  }

  static byId(id: string): Member | undefined {
    return byId.get(id);
  }

  // Resolve a member for an incoming request, creating one if the id is new/unknown. This is how the
  // tRPC context maps a stable client-provided id to a live Member across mutations + subscription.
  static getOrCreate(id?: string): Member {
    if (id) {
      const existing = byId.get(id);
      if (existing) return existing;
    }
    return new Member(id);
  }

  // Total tracked members (registry size).
  static count(): number {
    return members.length;
  }

  // Members with an open stream.
  static connectedCount(): number {
    let n = 0;
    for (const m of members) if (m.connected) ++n;
    return n;
  }

  constructor(id?: string) {
    this.socketBus = new EventEmitter();
    this.socketBus.setMaxListeners(0);
    this.id = id ?? _.uniqueId('member');
    this.lobby = undefined;
    this.name = '';
    this.color = 0;
    this.lastEmote = Date.now();
    this.activity = Date.now();
    this.removed = false;
    this.connected = true;
    this.country = undefined;
    this.activeStreams = 0;
    this.reapTimer = undefined;
    members.push(this);
    byId.set(this.id, this);
  }

  // A new SSE stream opened: cancel any pending reap (this is a reconnect within the grace window) and
  // mark the member connected.
  private openStream(): void {
    this.activeStreams++;
    this.connected = true;
    if (this.reapTimer) {
      clearTimeout(this.reapTimer);
      this.reapTimer = undefined;
    }
  }

  // An SSE stream ended. When the last one closes, mark offline and schedule a reap after the grace
  // window; a reconnect within the window cancels it (openStream). The reaper (Lobby.removePlayer +
  // Member.removePlayer) runs only if no stream reopened in time.
  private closeStream(): void {
    this.activeStreams = Math.max(0, this.activeStreams - 1);
    if (this.activeStreams > 0) return;
    this.connected = false;
    if (this.reapTimer) clearTimeout(this.reapTimer);
    this.reapTimer = setTimeout(() => {
      this.reapTimer = undefined;
      if (!this.removed) Member.reaper?.(this);
    }, Member.reapGraceMs);
    // Do not let a pending reap keep the process alive on its own.
    this.reapTimer.unref?.();
  }

  // Push a server->client event onto this member's stream.
  send(event: ServerEventName, ...args: unknown[]): void {
    const payload: ServerEvent = { event, args };
    this.socketBus.emit('event', payload);
  }

  // Async stream of events for an SSE subscription. Ends when the member disconnects or `signal`
  // aborts. Multiple concurrent subscriptions each get an independent buffered stream.
  async *subscribe(signal?: AbortSignal): AsyncGenerator<ServerEvent> {
    this.openStream();

    const queue: ServerEvent[] = [];
    let wake: (() => void) | null = null;
    let closed = false;

    const onEvent = (e: ServerEvent): void => {
      queue.push(e);
      wake?.();
    };
    const onClose = (): void => {
      closed = true;
      wake?.();
    };
    const onAbort = (): void => {
      closed = true;
      wake?.();
    };

    this.socketBus.on('event', onEvent);
    this.socketBus.once('close', onClose);
    signal?.addEventListener('abort', onAbort);

    try {
      // Guard against a signal that was already aborted before we attached the listener (the 'abort'
      // event will not re-fire), which would otherwise park on the wake promise indefinitely.
      if (signal?.aborted) return;
      for (;;) {
        while (queue.length > 0) {
          yield queue.shift() as ServerEvent;
        }
        if (closed) return;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
        wake = null;
      }
    } finally {
      this.socketBus.off('event', onEvent);
      this.socketBus.off('close', onClose);
      signal?.removeEventListener('abort', onAbort);
      this.closeStream();
    }
  }

  // End this member's stream(s); the subscription generator(s) complete.
  disconnect(): void {
    this.connected = false;
    this.socketBus.emit('close');
  }

  interact(): void {
    this.activity = Date.now();
  }

  inActiveLobby(): boolean {
    return !!this.lobby && this.lobby.members.length > 1;
  }

  isAdmin(): boolean {
    return !!this.lobby && this.lobby.admin === this.id;
  }
}
