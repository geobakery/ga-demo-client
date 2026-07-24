import type { Feature, Geometry } from 'geojson';

// Minimal structural view of a Leaflet layer that can be turned into GeoJSON.
// Markers, polygons and polylines all implement toGeoJSON(); anything else
// (tile layers, the bbox polygon, ...) is ignored.
interface GeoJSONLayer {
  toGeoJSON: () => unknown;
}

// Minimal view of a Leaflet LayerGroup / FeatureGroup: it can iterate its
// layers. Kept structural so the collection logic is testable without Leaflet.
export interface LayerGroupLike {
  eachLayer: (fn: (layer: unknown) => void) => void;
}

const asGeoJSONLayer = (layer: unknown): GeoJSONLayer | null =>
  typeof layer === 'object' &&
  layer !== null &&
  'toGeoJSON' in layer &&
  typeof (layer as GeoJSONLayer).toGeoJSON === 'function'
    ? (layer as GeoJSONLayer)
    : null;

// Read every drawn geometry currently held by the group.
//
// The FeatureGroup is the single source of truth: leaflet-draw adds a layer
// before firing onCreated and removes deleted layers before onDeleted, so
// reading it back yields the exact current set. Mirroring it (replace) instead
// of tracking geometries separately (append/clear) avoids the duplicated
// geometry (#16) and the wiped selection on a single delete (#17).
export function collectGeometries(group: LayerGroupLike): Feature<Geometry>[] {
  const features: Feature<Geometry>[] = [];
  group.eachLayer((layer) => {
    const geoLayer = asGeoJSONLayer(layer);
    if (geoLayer) {
      features.push(geoLayer.toGeoJSON() as Feature<Geometry>);
    }
  });
  return features;
}
