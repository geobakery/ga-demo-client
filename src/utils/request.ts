import type { Feature, Geometry } from 'geojson';
import {
  INTERFACE_PARAMETER_MAPPING,
  type InterfaceName,
  type ParameterName,
  type RequestParameters,
} from '../config/config';

export type RequestInput = {
  apiUrl: string;
  interfaceName: InterfaceName;
  topics: string[];
  geometries: Feature<Geometry>[];
  returnGeometry: boolean;
  parameters: RequestParameters;
};

export type ApiRequest = {
  url: string;
  body: Record<string, unknown>;
};

// valuesAtPoint accepts point geometries only; other interfaces take all.
export function selectInputGeometries(
  interfaceName: InterfaceName,
  geometries: Feature<Geometry>[],
): Feature<Geometry>[] {
  return interfaceName === 'valuesAtPoint'
    ? geometries.filter((feature) => feature.geometry.type === 'Point')
    : geometries;
}

// Message explaining why the request cannot be sent, or null if it can.
export function validateGeometries(
  interfaceName: InterfaceName,
  geometries: Feature<Geometry>[],
  parameters: RequestParameters = {},
): string | null {
  if (geometries.length === 0) {
    return 'No geometries to send. Please draw one.';
  }

  if (
    interfaceName === 'valuesAtPoint' &&
    selectInputGeometries(interfaceName, geometries).length === 0
  ) {
    return 'ValuesAtPoint requires a point geometry. Please draw a marker.';
  }

  const usesPolygonExclusion =
    parameters.polygonExcludesInnerFeatures === true ||
    parameters.polygonExcludesEntirelyInnerFeatures === true;

  if (
    interfaceName === 'nearestNeighbour' &&
    usesPolygonExclusion &&
    geometries.some((feature) => feature.geometry.type !== 'Polygon')
  ) {
    return 'Polygon exclusion options require Polygon input geometries.';
  }

  return null;
}

// Build URL and body of a GA request from the current selections.
export function buildRequest(input: RequestInput): ApiRequest {
  const activeParameters = INTERFACE_PARAMETER_MAPPING[input.interfaceName];

  const parameters = Object.fromEntries(
    Object.entries(input.parameters).filter(
      ([key, value]) =>
        activeParameters.includes(key as ParameterName) &&
        key !== 'returnGeometry' &&
        !(key === 'minDistanceToNeighbour' && value === 0),
    ),
  );

  const body: Record<string, unknown> = {
    topics: input.topics,
    inputGeometries: selectInputGeometries(
      input.interfaceName,
      input.geometries,
    ),
    outputFormat: 'geojson',
    returnGeometry: input.returnGeometry,
    outSRS: 4326,
    ...parameters,
  };

  return { url: `${input.apiUrl}/${input.interfaceName}`, body };
}
