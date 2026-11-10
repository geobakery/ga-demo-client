import { describe, expect, it } from 'vitest';
import type { Feature, Geometry } from 'geojson';
import {
  type RequestInput,
  buildRequest,
  selectInputGeometries,
  validateGeometries,
} from './request';

const point: Feature<Geometry> = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: [13.8, 51.0] },
};

const polygon: Feature<Geometry> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [13.7, 51.0],
        [13.9, 51.0],
        [13.9, 51.1],
        [13.7, 51.0],
      ],
    ],
  },
};

const baseInput: RequestInput = {
  apiUrl: 'https://example.org/ga/v2',
  interfaceName: 'within',
  topics: ['kreis_f'],
  geometries: [polygon],
  returnGeometry: true,
  parameters: {},
};

describe('selectInputGeometries', () => {
  it('keeps only points for valuesAtPoint', () => {
    expect(selectInputGeometries('valuesAtPoint', [polygon, point])).toEqual([
      point,
    ]);
  });

  it('passes all geometries through for other interfaces', () => {
    expect(selectInputGeometries('within', [polygon, point])).toEqual([
      polygon,
      point,
    ]);
  });
});

describe('validateGeometries', () => {
  it('rejects an empty geometry list', () => {
    expect(validateGeometries('within', [])).toMatch(/No geometries/);
  });

  it('rejects valuesAtPoint without a point', () => {
    expect(validateGeometries('valuesAtPoint', [polygon])).toMatch(
      /requires a point/,
    );
  });

  it('accepts valuesAtPoint with at least one point', () => {
    expect(validateGeometries('valuesAtPoint', [polygon, point])).toBeNull();
  });

  it('accepts any geometry for other interfaces', () => {
    expect(validateGeometries('within', [polygon])).toBeNull();
  });

  it('rejects point geometries when polygon exclusion is enabled', () => {
    expect(
      validateGeometries('nearestNeighbour', [point], {
        polygonExcludesInnerFeatures: true,
      }),
    ).toBe('Polygon exclusion options require Polygon input geometries.');
  });

  it('accepts polygon geometries when polygon exclusion is enabled', () => {
    expect(
      validateGeometries('nearestNeighbour', [polygon], {
        polygonExcludesInnerFeatures: true,
      }),
    ).toBeNull();
  });
});

describe('buildRequest', () => {
  it('targets the interface endpoint below the api url', () => {
    expect(buildRequest(baseInput).url).toBe(
      'https://example.org/ga/v2/within',
    );
  });

  it('builds the common body fields', () => {
    expect(buildRequest(baseInput).body).toEqual({
      topics: ['kreis_f'],
      inputGeometries: [polygon],
      outputFormat: 'geojson',
      returnGeometry: true,
      outSRS: 4326,
    });
  });

  it('adds interface parameters to the body', () => {
    const { body } = buildRequest({
      ...baseInput,
      interfaceName: 'nearestNeighbour',
      parameters: { count: 3, maxDistanceToNeighbour: 500 },
    });
    expect(body).toMatchObject({ count: 3, maxDistanceToNeighbour: 500 });
  });

  it('sends only point geometries for valuesAtPoint', () => {
    const { body } = buildRequest({
      ...baseInput,
      interfaceName: 'valuesAtPoint',
      geometries: [polygon, point],
      returnGeometry: false,
    });
    expect(body.inputGeometries).toEqual([point]);
    expect(body.returnGeometry).toBe(false);
  });

  it('drops parameters that do not belong to the selected interface', () => {
    const { body } = buildRequest({
      ...baseInput,
      interfaceName: 'within',
      parameters: {
        count: 5,
        maxDistanceToNeighbour: 2000,
        buffer: 100,
      },
    });

    expect(body).toMatchObject({
      buffer: 100,
    });

    expect(body).not.toHaveProperty('count');
    expect(body).not.toHaveProperty('maxDistanceToNeighbour');
  });
});
