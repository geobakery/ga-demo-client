// Default spatial tests used by topics
export const DEFAULT_SPATIAL_TESTS = [
  'within',
  'intersect',
  'nearestNeighbour',
] as const;
export const POINT_SPATIAL_TESTS = ['intersect', 'nearestNeighbour'] as const;
export const RASTER_SPATIAL_TESTS = ['valuesAtPoint'] as const;

// Supported interfaces
export const INTERFACES = [
  'within',
  'intersect',
  'nearestNeighbour',
  'valuesAtPoint',
] as const;

// Default interface shown in the UI
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

// Bounding box polygon shown in the map
export const BOUNDING_BOX: number[][] = [
  [50.952162, 13.666581],
  [50.952162, 13.946723],
  [51.066846, 13.946723],
  [51.066846, 13.666581],
];

// Mapping of topics to supported interfaces
export const topicInterfaceMapping: Record<string, string[]> = {
  land_f: [...DEFAULT_SPATIAL_TESTS],
  kreis_f: [...DEFAULT_SPATIAL_TESTS],
  gemeinde_f: [...DEFAULT_SPATIAL_TESTS],
  gemarkung_f: [...DEFAULT_SPATIAL_TESTS],
  flurstueck_f: [...DEFAULT_SPATIAL_TESTS],
  schutzgebiet_f: [...DEFAULT_SPATIAL_TESTS],
  wasserschutzgebiet_f: [...DEFAULT_SPATIAL_TESTS],
  natura2000_f: [...DEFAULT_SPATIAL_TESTS],
  natura2000_p: [...POINT_SPATIAL_TESTS],
  hohlraumbergaufsicht_f: [...DEFAULT_SPATIAL_TESTS],
  hohlraumunterirdisch_f: [...DEFAULT_SPATIAL_TESTS],
  aspsperrzone_f: [...DEFAULT_SPATIAL_TESTS],
  adresse_p: [...POINT_SPATIAL_TESTS],
  hoehe_r: [...RASTER_SPATIAL_TESTS],
  th_verwaltungseinheit_f: [...DEFAULT_SPATIAL_TESTS],
};

// Labels for topics shown in the UI
export const TOPIC_LABELS: Record<string, string> = {
  land_f: 'Land',
  kreis_f: 'Kreis',
  gemeinde_f: 'Gemeinde',
  gemarkung_f: 'Gemarkung',
  flurstueck_f: 'Flurstück',
  schutzgebiet_f: 'Schutzgebiet',
  wasserschutzgebiet_f: 'Wasserschutzgebiet',
  natura2000_f: 'Natura 2000 (Fläche)',
  natura2000_p: 'Natura 2000 (Punkt)',
  hohlraumbergaufsicht_f: 'Hohlraum Bergaufsicht',
  hohlraumunterirdisch_f: 'Hohlraum Unterirdisch',
  aspsperrzone_f: 'Afrikanische Schweinepest Sperrzone',
  adresse_p: 'Adresse (Punkt)',
  hoehe_r: 'Höhe',
  th_verwaltungseinheit_f: 'Thüringer Verwaltungseinheit',
};
