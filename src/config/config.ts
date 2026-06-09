import { normalizeApiUrl } from '../utils/apiUrl';

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

// Show the bbox overlay (only useful when running GeospatialAnalyzer with the demo data)
export const SHOW_BBOX: boolean = import.meta.env.VITE_SHOW_BBOX === 'true';

// Bounding box polygon shown in the map
export const BOUNDING_BOX: number[][] = [
  [50.952162, 13.666581],
  [50.952162, 13.946723],
  [51.066846, 13.946723],
  [51.066846, 13.666581],
];

// Basemap (tile layer) configuration
export const TILE_LAYER_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
