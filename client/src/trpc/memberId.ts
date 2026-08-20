// Member identity. The server's tRPC context (server/trpc/context.ts) maps this id to a live Member
// across every mutation (sent as the `x-ooc-member-id` header) and the SSE subscription (sent as the
// `?memberId=` query, since EventSource cannot set headers).
//
// Stored in sessionStorage, NOT localStorage, because the id must be per-TAB. localStorage is shared
// across every tab of an origin, so two tabs resolved to one server-side Member and each new tab
// stomped the other's lobby membership. sessionStorage still survives a reload of the same tab, so
// reconnect/auto-rejoin keeps working; a second tab simply gets its own identity, which is what
// playing two seats from one browser requires.

export const MEMBER_ID_KEY = 'oocMemberId';

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without WebCrypto randomUUID.
  return `member-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Read this tab's member id, minting and storing a fresh one the first time. */
export function getMemberId(): string {
  let id: string | null = null;
  try {
    id = sessionStorage.getItem(MEMBER_ID_KEY);
  } catch {
    // sessionStorage may be unavailable (private mode / SSR); fall through to a volatile id.
  }
  if (!id) {
    id = randomId();
    try {
      sessionStorage.setItem(MEMBER_ID_KEY, id);
    } catch {
      // ignore write failures; the volatile id still works for this session
    }
  }
  return id;
}
