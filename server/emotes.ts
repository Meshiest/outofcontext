// The valid emote names. Sent as a name string, not an index.
export const EMOTES = [
  'smile',
  'meh',
  'frown',
  'heart',
  'bug',
  'hand rock',
  'hand paper',
  'hand scissors',
  'question',
  'exclamation',
  'wait',
  'write',
  'check',
  'times',
  'thumbs up',
  'thumbs down',
] as const;

export type EmoteName = (typeof EMOTES)[number];
