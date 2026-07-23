import { describe, expect, it } from 'vitest';
import { toTopic } from './topics';

describe('toTopic', () => {
  it('picks the shortest identifier', () => {
    expect(
      toTopic({ identifiers: ['sn_kreis_f', 'kreis_f'], supports: [] })
        .identifier,
    ).toBe('kreis_f');
  });

  it('picks the shortest identifier regardless of input order', () => {
    expect(
      toTopic({ identifiers: ['kreis_f', 'sn_kreis_f'], supports: [] })
        .identifier,
    ).toBe('kreis_f');
  });

  it('keeps a single identifier as is', () => {
    expect(toTopic({ identifiers: ['gemarkung'] }).identifier).toBe(
      'gemarkung',
    );
  });

  it('passes the supported interfaces through', () => {
    expect(
      toTopic({ identifiers: ['gemarkung'], supports: ['within', 'intersect'] })
        .interfaces,
    ).toEqual(['within', 'intersect']);
  });

  it('falls back to an empty interface list when supports is missing', () => {
    expect(toTopic({ identifiers: ['gemarkung'] }).interfaces).toEqual([]);
  });

  it('does not mutate the input identifiers', () => {
    const raw = { identifiers: ['sn_kreis_f', 'kreis_f'] };
    toTopic(raw);
    expect(raw.identifiers).toEqual(['sn_kreis_f', 'kreis_f']);
  });
});
