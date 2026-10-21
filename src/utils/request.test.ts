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

const lineString: Feature<Geometry> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [13.7, 51.0],
      [13.9, 51.1],
    ],
  },
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

const multiPoint: Feature<Geometry> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'MultiPoint',
    coordinates: [
      [13.8, 51.0],
      [13.9, 51.1],
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
  it('keeps Point, LineString and Polygon for valuesAtPoint', () => {
    expect(
      selectInputGeometries('valuesAtPoint', [
        multiPoint,
        polygon,
        lineString,
        point,
      ]),
    ).toEqual([polygon, lineString, point]);
  });

  it('excludes unsupported geometry types for valuesAtPoint', () => {
    expect(selectInputGeometries('valuesAtPoint', [multiPoint])).toEqual([]);
  });

  it('passes all geometries through for other interfaces', () => {
    expect(
      selectInputGeometries('within', [polygon, point, lineString, multiPoint]),
    ).toEqual([polygon, point, lineString, multiPoint]);
  });
});

describe('validateGeometries', () => {
  it('rejects an empty geometry list', () => {
    expect(validateGeometries('within', [])).toMatch(/No geometries/);
  });

  it('rejects valuesAtPoint without a supported geometry', () => {
    expect(validateGeometries('valuesAtPoint', [multiPoint])).toMatch(
      /requires a Point, LineString or Polygon geometry/,
    );
  });

  it.each([
    ['Point', point],
    ['LineString', lineString],
    ['Polygon', polygon],
  ])(
    'accepts valuesAtPoint with a Point, LineString or Polygon as geometry',
    (_type, geometry) => {
      expect(validateGeometries('valuesAtPoint', [geometry])).toBeNull();
    },
  );

  it('accepts valuesAtPoint with a mixture of supported geometries', () => {
    expect(
      validateGeometries('valuesAtPoint', [polygon, lineString, point]),
    ).toBeNull();
  });

  it('accepts any geometry for other interfaces', () => {
    expect(validateGeometries('within', [polygon])).toBeNull();
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

  it('sends all supported geometry types for valuesAtPoint', () => {
    const { body } = buildRequest({
      ...baseInput,
      interfaceName: 'valuesAtPoint',
      geometries: [polygon, lineString, point, multiPoint],
      returnGeometry: false,
    });
    expect(body.inputGeometries).toEqual([polygon, lineString, point]);
    expect(body.returnGeometry).toBe(false);
  });
});
