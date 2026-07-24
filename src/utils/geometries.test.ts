import { describe, expect, it } from 'vitest';
import type { Feature, Geometry } from 'geojson';
import { collectGeometries, type LayerGroupLike } from './geometries';

// A fake Leaflet layer: toGeoJSON() returns the feature it was built with.
const layer = (feature: Feature<Geometry>) => ({
  toGeoJSON: () => feature,
});

// A mutable fake FeatureGroup whose current layers can be changed between
// reads, mirroring how leaflet-draw mutates the real group before each event.
const group = (layers: unknown[]): LayerGroupLike & { layers: unknown[] } => ({
  layers,
  eachLayer(fn: (layer: unknown) => void) {
    this.layers.forEach(fn);
  },
});

const point = (id: string): Feature<Geometry> => ({
  type: 'Feature',
  properties: { id },
  geometry: { type: 'Point', coordinates: [0, 0] },
});

const a = point('a');
const b = point('b');

describe('collectGeometries', () => {
  it('returns an empty array for an empty group', () => {
    expect(collectGeometries(group([]))).toEqual([]);
  });

  it('returns the geometry of a single drawn layer', () => {
    expect(collectGeometries(group([layer(a)]))).toEqual([a]);
  });

  it('preserves the order of the layers', () => {
    expect(collectGeometries(group([layer(a), layer(b)]))).toEqual([a, b]);
  });

  it('skips layers that cannot be serialized to GeoJSON', () => {
    // e.g. the bbox polygon or a tile layer that has no toGeoJSON()
    const notAShape = { redraw: () => {} };
    expect(collectGeometries(group([layer(a), notAShape]))).toEqual([a]);
  });

  // Regression for #16: setting a second marker returned 3 results instead of
  // 2, because the geometry was appended both in the map handler and in the
  // app state. Mirroring the group yields exactly the layers it holds.
  it('mirrors the group after a second marker is added (#16)', () => {
    const g = group([layer(a)]);
    expect(collectGeometries(g)).toHaveLength(1);
    g.layers.push(layer(b));
    expect(collectGeometries(g)).toEqual([a, b]);
  });

  // Regression for #17: deleting one of two markers cleared the whole selection.
  // leaflet-draw removes the deleted layer from the group before firing the
  // event, so collecting afterwards must return the remaining shape, not [].
  it('keeps the remaining marker after one is deleted (#17)', () => {
    const g = group([layer(a), layer(b)]);
    g.layers = [layer(b)];
    expect(collectGeometries(g)).toEqual([b]);
  });
});
