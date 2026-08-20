import { describe, it, expect } from 'vitest';
import { pseudoize, pseudoizeTree, buildPseudoResources } from './pseudo';

const A = String.fromCharCode(0xe1); // accented a
const DOT = String.fromCharCode(0xb7); // pad char

describe('pseudoize', () => {
  it('brackets, accents, and pads a plain string', () => {
    const out = pseudoize('cat');
    expect(out.startsWith('[')).toBe(true);
    expect(out.endsWith(']')).toBe(true);
    expect(out).toContain(A); // 'a' -> accented a
    expect(out).toContain(DOT); // length padding
  });

  it('leaves {{interpolation}} placeholders untouched', () => {
    const out = pseudoize('Hello {{name}}');
    expect(out).toContain('{{name}}');
  });

  it('leaves <tag> markers untouched', () => {
    const out = pseudoize('Read <1>the code</1> now');
    expect(out).toContain('<1>');
    expect(out).toContain('</1>');
  });

  it('is longer than the source (expansion)', () => {
    expect(pseudoize('short').length).toBeGreaterThan('short'.length);
  });
});

describe('pseudoizeTree / buildPseudoResources', () => {
  it('pseudoizes nested leaf strings only', () => {
    const tree = pseudoizeTree({ a: 'one', nested: { b: 'two' } });
    expect(typeof tree.a).toBe('string');
    expect(typeof (tree.nested as Record<string, unknown>).b).toBe('string');
    expect(tree.a).toContain('[');
  });

  it('builds one pseudoized namespace per input namespace', () => {
    const res = buildPseudoResources({ common: { hi: 'hi' }, home: { title: 'Home' } });
    expect(Object.keys(res)).toEqual(['common', 'home']);
    expect((res.home as Record<string, string>).title).toContain('[');
  });
});

describe('pseudoizeTree with list values', () => {
  it('keeps a list a list', () => {
    // A game's howTo steps. Recursing into the array as an object would yield {0:..,1:..}, which
    // `returnObjects` hands back instead of a list - the steps then render as nothing at all.
    const out = pseudoizeTree({ howTo: ['first step', 'second step'] });
    expect(Array.isArray(out.howTo)).toBe(true);
    expect(out.howTo).toHaveLength(2);
    expect(String((out.howTo as string[])[0])).toContain('[');
  });
});
