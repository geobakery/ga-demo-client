// Supported interfaces
export const INTERFACES = [
  'within',
  'intersect',
  'nearestNeighbour',
  'valuesAtPoint',
] as const;

// Spatial tests used by topics
export const DEFAULT_SPATIAL_TESTS = [
  'within',
  'intersect',
  'nearestNeighbour',
] as const;
export const POINT_SPATIAL_TESTS = ['intersect', 'nearestNeighbour'] as const;
export const RASTER_SPATIAL_TESTS = ['valuesAtPoint'] as const;

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

// Topic-to-interface mapping and optional UI labels
export const TOPICS: Record<string, { interfaces: string[]; label?: string }> =
  {
    land_f: { interfaces: [...DEFAULT_SPATIAL_TESTS], label: 'Land' },
    kreis_f: { interfaces: [...DEFAULT_SPATIAL_TESTS], label: 'Kreis' },
    gemeinde_f: { interfaces: [...DEFAULT_SPATIAL_TESTS], label: 'Gemeinde' },
    gemarkung_f: { interfaces: [...DEFAULT_SPATIAL_TESTS], label: 'Gemarkung' },
    flurstueck_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Flurstück',
    },
    schutzgebiet_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Schutzgebiet',
    },
    wasserschutzgebiet_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Wasserschutzgebiet',
    },
    natura2000_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Natura 2000 (Fläche)',
    },
    natura2000_p: {
      interfaces: [...POINT_SPATIAL_TESTS],
      label: 'Natura 2000 (Punkt)',
    },
    hohlraumbergaufsicht_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Hohlraum Bergaufsicht',
    },
    hohlraumunterirdisch_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Hohlraum Unterirdisch',
    },
    aspsperrzone_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Afrikanische Schweinepest Sperrzone',
    },
    adresse_p: {
      interfaces: [...POINT_SPATIAL_TESTS],
      label: 'Adresse (Punkt)',
    },
    hoehe_r: { interfaces: [...RASTER_SPATIAL_TESTS], label: 'Höhe' },
    th_verwaltungseinheit_f: {
      interfaces: [...DEFAULT_SPATIAL_TESTS],
      label: 'Thüringer Verwaltungseinheit',
    },
  };

// Initial map view
export const INITIAL_POSITION: [number, number] = [51.009504, 13.806652];
export const INITIAL_ZOOM = 13;

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
