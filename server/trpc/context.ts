import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Member } from '../../core/Member.js';
import { parseCountry } from '../../core/Metrics.js';
import { metrics } from '../../core/Metrics.js';

// Every request/subscription resolves to a live Member. The client sends a stable id via the
// `x-ooc-member-id` header (mutations/queries) or `?memberId=` query (SSE EventSource, which cannot
// set headers). Unknown/absent ids mint a fresh Member.
export interface Context {
  member: Member;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function createContext(opts: CreateExpressContextOptions): Context {
  const headerId = firstHeader(opts.req.headers['x-ooc-member-id']);
  const queryId =
    typeof opts.req.query.memberId === 'string'
      ? opts.req.query.memberId
      : undefined;
  const id = headerId ?? queryId;
  // Look before creating, so a member id we have never seen can be counted as a new session.
  const known = id ? Member.byId(id) : undefined;
  const member = Member.getOrCreate(id);
  // Cloudflare resolves the country and we keep only that. The IP it came from (CF-Connecting-IP)
  // is deliberately never read. First resolvable value wins, so a member's label stays stable.
  member.country ??= parseCountry(opts.req.headers['cf-ipcountry']);
  // Only when the caller actually SENT an id. A request without one also mints a Member, but that
  // is a bare probe of /trpc rather than a browser running the app, and counting it would inflate
  // the number with scanner traffic. A reconnect re-sends its id, so it is not counted twice.
  if (id && !known) metrics.sessionStarted({ country: member.country });
  return { member };
}
