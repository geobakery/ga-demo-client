import { describe, expect, it } from 'vitest';
import { toTopic, topicTooltip } from './topics';

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

  it('passes title and description through', () => {
    expect(
      toTopic({
        identifiers: ['kreis_f'],
        title: 'Landkreise/Kreise',
        description: 'Landkreise und kreisfreie Städte in Sachsen.',
      }),
    ).toMatchObject({
      title: 'Landkreise/Kreise',
      description: 'Landkreise und kreisfreie Städte in Sachsen.',
    });
  });
});

describe('topicTooltip', () => {
  it('joins title and description', () => {
    expect(
      topicTooltip({
        identifier: 'kreis_f',
        interfaces: [],
        title: 'Landkreise/Kreise',
        description: 'Landkreise und kreisfreie Städte in Sachsen.',
      }),
    ).toBe('Landkreise/Kreise: Landkreise und kreisfreie Städte in Sachsen.');
  });

  it('falls back to whichever part is present', () => {
    expect(
      topicTooltip({
        identifier: 'kreis_f',
        interfaces: [],
        title: 'Landkreise/Kreise',
      }),
    ).toBe('Landkreise/Kreise');
    expect(
      topicTooltip({
        identifier: 'kreis_f',
        interfaces: [],
        description: 'Landkreise in Sachsen.',
      }),
    ).toBe('Landkreise in Sachsen.');
  });

  it('returns undefined when neither is set', () => {
    expect(
      topicTooltip({ identifier: 'kreis_f', interfaces: [] }),
    ).toBeUndefined();
  });
});
