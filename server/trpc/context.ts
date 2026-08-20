import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Member } from '../../core/Member.js';

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
  const member = Member.getOrCreate(id);
  return { member };
}
