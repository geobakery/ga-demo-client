import React, { useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon,
  GeoJSON,
} from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  BOUNDING_BOX,
  SHOW_BBOX,
  SAXONY_OUTLINE,
  SHOW_SAXONY_OUTLINE,
  TILE_LAYER_URL,
  TILE_LAYER_ATTRIBUTION,
} from '../config/config';
import { propertiesToElement } from '../utils/popup';
import { collectGeometries } from '../utils/geometries';
import BboxLabels from './BboxLabels';
import ClearResponsesControl from './ClearResponsesControl';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet default icons for build
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/ga/demo-map/images/marker-icon-2x.png',
  iconUrl: '/ga/demo-map/images/marker-icon.png',
  shadowUrl: '/ga/demo-map/images/marker-shadow.png',
});

const SAXONY_BOUNDS = L.latLngBounds(SAXONY_OUTLINE.flat());

const SAXONY_BORDER_STYLE: L.PathOptions = {
  color: '#3f4a5a',
  weight: 2,
  opacity: 0.8,
  fill: false,
};

interface MapProps {
  initialPosition: LatLngExpression;
  initialZoom: number;
  setUserGeometries: (geometries: Feature<Geometry>[]) => void;
  apiGeometries: Feature<Geometry>[];
  clearApiGeometries: () => void;
}

const Map: React.FC<MapProps> = ({
  initialPosition,
  initialZoom,
  setUserGeometries,
  apiGeometries,
  clearApiGeometries,
}) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  // Mirror the FeatureGroup into state after every create/edit/delete.
  // leaflet-draw keeps the group current, so replacing the state with its
  // contents (see collectGeometries) fixes the duplicate geometry (#16) and
  // the lost selection when deleting one of several shapes (#17).
  const syncDrawnGeometries = () => {
    const group = featureGroupRef.current;
    if (!group) return;
    setUserGeometries(collectGeometries(group));
  };

  const convertToLatLng = (positions: number[][]): LatLngExpression[] => {
    return positions.map((position) => {
      return [position[0], position[1]] as LatLngExpression;
    });
  };

  const polygonPositions: LatLngExpression[] = convertToLatLng(BOUNDING_BOX);

  const apiFeatureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: apiGeometries,
  };

  const onEachApiFeature = (feature: Feature, layer: L.Layer) => {
    layer.bindPopup(propertiesToElement(feature.properties), {
      maxWidth: 360,
      maxHeight: 360,
    });
  };

  return (
    <div className="map-container">
      <MapContainer
        // MapContainer ignores bounds once center/zoom are set, so the demo
        // close-up and the Saxony-wide view are passed exclusively.
        {...(SHOW_BBOX
          ? { center: initialPosition, zoom: initialZoom }
          : {
              bounds: SAXONY_BOUNDS,
              boundsOptions: { padding: [16, 16] },
              // fitBounds rounds down to the next zoomSnap step; with the
              // default of 1 the state floats in too much empty margin.
              zoomSnap: 0.5,
            })}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer attribution={TILE_LAYER_ATTRIBUTION} url={TILE_LAYER_URL} />
        {/* Non-interactive so the border never swallows a click meant for a
            drawn or returned geometry. */}
        {SHOW_SAXONY_OUTLINE && (
          <Polygon
            positions={SAXONY_OUTLINE}
            pathOptions={SAXONY_BORDER_STYLE}
            interactive={false}
            attribution="&copy; GeoSN, <a href='https://www.govdata.de/dl-de/by-2-0'>dl-de/by-2-0</a>"
          />
        )}
        {SHOW_BBOX && (
          <Polygon positions={polygonPositions} color="gray" fill={false} />
        )}
        {SHOW_BBOX && <BboxLabels />}
        <GeoJSON
          key={apiGeometries.length}
          data={apiFeatureCollection}
          style={{ color: 'coral' }}
          onEachFeature={onEachApiFeature}
        />
        {apiGeometries.length > 0 && (
          <ClearResponsesControl onClear={clearApiGeometries} />
        )}
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            draw={{
              rectangle: false,
              polyline: true,
              circle: false,
              circlemarker: false,
              marker: true,
              polygon: true,
            }}
            edit={{
              remove: true,
              edit: false,
            }}
            onEdited={syncDrawnGeometries}
            onCreated={syncDrawnGeometries}
            onDeleted={syncDrawnGeometries}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default Map;
