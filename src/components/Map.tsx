import React, { useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Feature, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface LeafletEvent {
  layers: L.LayerGroup<L.Layer>;
  layer: L.Layer;
}

interface MapProps {
  initialPosition: LatLngExpression;
  initialZoom: number;
  setGeometries: (geometries: Feature<Geometry>[]) => void;
}

const Map: React.FC<MapProps> = ({
  initialPosition,
  initialZoom,
  setGeometries,
}) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  const onEdited = (e: LeafletEvent) => {
    const layers = e.layers;
    const geometries: Feature<Geometry>[] = [];

    layers.eachLayer((layer: L.Layer) => {
      if ('toGeoJSON' in layer && typeof layer.toGeoJSON === 'function') {
        const geoJson = (layer as L.FeatureGroup).toGeoJSON();
        geometries.push(geoJson as Feature<Geometry>);
      } else {
        console.error('Layer does not support toGeoJSON method');
      }
    });

    setGeometries(geometries);
  };

  const onCreated = (e: LeafletEvent) => {
    const { layer } = e;

    // Überprüfen, ob der Layer ein FeatureLayer ist, der die toGeoJSON-Methode hat
    if ('toGeoJSON' in layer && typeof layer.toGeoJSON === 'function') {
      const geoJson = (layer as L.FeatureGroup).toGeoJSON();
      setGeometries([geoJson as Feature<Geometry>]);
    } else {
      console.error('Layer does not support toGeoJSON method');
    }
  };

  return (
    <div className="map-container">
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
            }}
            onEdited={onEdited}
            onCreated={onCreated}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default Map;
