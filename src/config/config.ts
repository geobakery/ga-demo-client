import { normalizeApiUrl } from '../utils/apiUrl';
import saxonyOutline from './saxony-outline.json';

// Default API base URL (build-time value from the environment). The base must
// include the version segment (e.g. ".../ga/v2") so that the appended endpoint
// paths resolve correctly.
export const DEFAULT_API_URL: string = normalizeApiUrl(
  import.meta.env.VITE_API_URL,
);

// Supported interfaces
export const INTERFACES = [
  'within',
  'intersect',
  'nearestNeighbour',
  'valuesAtPoint',
] as const;

// Interface shown on application start
export const DEFAULT_INTERFACE = 'within';

// Mapping of interfaces to their parameters
export const INTERFACE_PARAMETER_MAPPING: Record<string, string[]> = {
  within: ['returnGeometry'],
  intersect: ['returnGeometry'],
  nearestNeighbour: ['returnGeometry', 'count', 'maxDistanceToNeighbour'],
  valuesAtPoint: [],
};

// Default parameters for each interface
export const INTERFACE_DEFAULT_PARAMETERS: Record<
  string,
  Record<string, unknown>
> = {
  within: { returnGeometry: true },
  intersect: { returnGeometry: true },
  nearestNeighbour: {
    returnGeometry: true,
    count: 5,
    maxDistanceToNeighbour: 2000,
  },
  valuesAtPoint: {},
};

// Initial map view
export const INITIAL_POSITION: [number, number] = [51.009504, 13.806652];
export const INITIAL_ZOOM = 13;

// Extent of the data behind the configured API: "demo" shows the hardcoded
// demo-data bounding box, "saxony" (default) the state border. The map starts
// zoomed to the chosen extent.
export const DATA_EXTENT: 'demo' | 'saxony' =
  import.meta.env.VITE_DATA_EXTENT === 'demo' ? 'demo' : 'saxony';

// Show the bbox overlay (only useful when running GeospatialAnalyzer with the demo data)
export const SHOW_BBOX: boolean = DATA_EXTENT === 'demo';

// Bounding box polygon shown in the map
export const BOUNDING_BOX: number[][] = [
  [50.952162, 13.666581],
  [50.952162, 13.946723],
  [51.066846, 13.946723],
  [51.066846, 13.666581],
];

// Show the Saxony state border, marking where results can be expected.
export const SHOW_SAXONY_OUTLINE: boolean = DATA_EXTENT === 'saxony';

// Saxony state border as Leaflet rings ([lat, lng], unlike GeoJSON's
// [lng, lat]). Generalized offline from the API's own "land_f" topic; see the
// properties in saxony-outline.json for source and tolerance.
export const SAXONY_OUTLINE: [number, number][][] =
  saxonyOutline.geometry.coordinates.map((ring) =>
    ring.map(([lng, lat]) => [lat, lng] as [number, number]),
  );

// Basemap (tile layer) configuration
export const TILE_LAYER_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
