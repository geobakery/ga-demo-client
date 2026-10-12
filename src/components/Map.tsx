import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon,
  GeoJSON,
  useMapEvents,
} from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from 'geojson';
import {
  BOUNDING_BOX,
  SHOW_BBOX,
  SAXONY_OUTLINE,
  SHOW_SAXONY_OUTLINE,
  TILE_LAYER_URL,
  TILE_LAYER_ATTRIBUTION,
  API_GEOMETRY_STYLE,
  BUFFER_GEOMETRY_STYLE,
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

// Style of the clicked result geometry: thick purple outline, light purple fill.
const SELECTED_GEOMETRY_STYLE: L.PathOptions = {
  color: '#7c3aed',
  weight: 4,
  opacity: 1,
  fillColor: '#7c3aed',
  fillOpacity: 0.3,
};

// Defined once on purpose: react-leaflet re-applies the style prop to all
// layers whenever its identity changes, which would wipe the highlight.
const getApiFeatureStyle = (
  feature?: Feature<Geometry, GeoJsonProperties>,
): L.PathOptions =>
  feature?.properties?.__buffer === true
    ? BUFFER_GEOMETRY_STYLE
    : API_GEOMETRY_STYLE;

// Layers with path styling (polygons, lines, multi-geometries); markers have
// no setStyle and are not highlighted.
type StyleableLayer = L.Layer & {
  setStyle: (style: L.PathOptions) => void;
  bringToFront?: () => void;
};

const isStyleable = (layer: L.Layer): layer is StyleableLayer => {
  return 'setStyle' in layer && typeof layer.setStyle === 'function';
};

// Must match the breakpoint in App.css where the map is stacked above the
// sidebar.
const STACKED_LAYOUT_QUERY = '(max-width: 768px)';

// True while the map is stacked above the sidebar (narrow screens).
const useStackedLayout = () => {
  const [stacked, setStacked] = useState(
    () => window.matchMedia(STACKED_LAYOUT_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(STACKED_LAYOUT_QUERY);
    const handleChange = (event: MediaQueryListEvent) =>
      setStacked(event.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return stacked;
};

// Reports clicks on the map itself (not on a layer that handled the click).
const MapClickHandler: React.FC<{
  onClick: (event: L.LeafletMouseEvent) => void;
}> = ({ onClick }) => {
  useMapEvents({ click: onClick });
  return null;
};

interface MapProps {
  initialPosition: LatLngExpression;
  initialZoom: number;
  setUserGeometries: (geometries: Feature<Geometry>[]) => void;
  apiGeometries: Feature<Geometry, GeoJsonProperties>[];
  clearApiGeometries: () => void;
  onFeatureSelect: (properties: GeoJsonProperties) => void;
}

const Map: React.FC<MapProps> = ({
  initialPosition,
  initialZoom,
  setUserGeometries,
  apiGeometries,
  clearApiGeometries,
  onFeatureSelect,
}) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const geoJsonRef = useRef<L.GeoJSON>(null);
  // Currently highlighted result geometry.
  const selectedLayerRef = useRef<L.Layer | null>(null);
  // Browser event of the last click on a result geometry, so the map-level
  // click that follows the same event doesn't clear the new selection.
  const lastLayerClickRef = useRef<Event | null>(null);
  const isStackedLayout = useStackedLayout();

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

  // Restore the original style of the highlighted geometry.
  const clearHighlight = () => {
    const layer = selectedLayerRef.current;
    if (layer) geoJsonRef.current?.resetStyle(layer);
    selectedLayerRef.current = null;
  };

  const highlightLayer = (layer: L.Layer) => {
    if (selectedLayerRef.current === layer) return;

    clearHighlight();

    if (isStyleable(layer)) {
      layer.setStyle(SELECTED_GEOMETRY_STYLE);
      layer.bringToFront?.();
      selectedLayerRef.current = layer;
    }
  };

  // Click on the map but not on a result geometry: back to the normal view.
  const handleMapClick = (event: L.LeafletMouseEvent) => {
    if (event.originalEvent === lastLayerClickRef.current) return;

    clearHighlight();
    onFeatureSelect(null);
  };

  // The GeoJSON layer is rebuilt when geometries or the layout mode change,
  // which drops the highlighted layer; reset the selection with it.
  const geoJsonKey = `${apiGeometries.length}-${isStackedLayout}`;

  useEffect(() => {
    selectedLayerRef.current = null;
    onFeatureSelect(null);
  }, [geoJsonKey, onFeatureSelect]);

  // Wide screens: popup on the map. Stacked layout: no popup, the info block
  // below the map shows the clicked feature's properties instead.
  const onEachApiFeature = (feature: Feature, layer: L.Layer) => {
    layer.on('click', (event: L.LeafletMouseEvent) => {
      lastLayerClickRef.current = event.originalEvent;
      highlightLayer(layer);

      if (isStackedLayout) onFeatureSelect(feature.properties);
    });

    if (isStackedLayout) return;

    layer.bindPopup(propertiesToElement(feature.properties), {
      maxWidth: 360,
      maxHeight: 360,
    });

    // Popup closed (e.g. via its close button): no highlight anymore.
    layer.on('popupclose', () => {
      if (selectedLayerRef.current === layer) clearHighlight();
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
      >
        <TileLayer attribution={TILE_LAYER_ATTRIBUTION} url={TILE_LAYER_URL} />
        <MapClickHandler onClick={handleMapClick} />
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
          ref={geoJsonRef}
          key={geoJsonKey}
          data={apiFeatureCollection}
          style={getApiFeatureStyle}
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
