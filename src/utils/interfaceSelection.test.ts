import { describe, expect, it } from 'vitest';
import type { Topic } from './topics';
import { selectInterface, topicsForInterface } from './interfaceSelection';

const topics: Topic[] = [
  { identifier: 'kreis_f', interfaces: ['within', 'intersect'] },
  { identifier: 'gemeinde_f', interfaces: ['within'] },
  { identifier: 'hoehe', interfaces: ['valuesAtPoint'] },
];

describe('topicsForInterface', () => {
  it('lists the topics supported by the interface', () => {
    expect(topicsForInterface('within', topics)).toEqual([
      topics[0],
      topics[1],
    ]);
  });

  it('returns an empty list when nothing is supported', () => {
    expect(topicsForInterface('nearestNeighbour', topics)).toEqual([]);
  });
});

describe('selectInterface', () => {
  it('keeps only the selected topics the new interface supports', () => {
    const selection = selectInterface('intersect', topics, [
      'kreis_f',
      'gemeinde_f',
    ]);
    expect(selection.selectedTopics).toEqual(['kreis_f']);
  });

  it('resets the parameter values to the interface defaults', () => {
    expect(
      selectInterface('nearestNeighbour', topics, []).parameterValues,
    ).toEqual({ count: 5, maxDistanceToNeighbour: 2000 });
  });

  it('clears the parameter values for an interface without parameters', () => {
    expect(selectInterface('within', topics, []).parameterValues).toEqual({});
  });

  it('returns a copy of the defaults, not the config object', () => {
    const first = selectInterface('nearestNeighbour', topics, []);
    const second = selectInterface('nearestNeighbour', topics, []);
    expect(first.parameterValues).not.toBe(second.parameterValues);
  });

  it('turns returnGeometry on for within', () => {
    expect(selectInterface('within', topics, []).returnGeometry).toBe(true);
  });

  it('turns returnGeometry off for valuesAtPoint', () => {
    expect(selectInterface('valuesAtPoint', topics, []).returnGeometry).toBe(
      false,
    );
  });
});
