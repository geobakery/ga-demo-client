import React, { useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import L, { DrawEvents, LatLngExpression } from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Feature, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface CreatedEvent {
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

  const onEdited = (e: DrawEvents.Edited) => {
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

    console.log('Edited geometries:', geometries);
    setGeometries(geometries);
  };

  const onCreated = (e: CreatedEvent) => {
    const { layer } = e;

    // Check that the layer is a FeatureLayer that has the toGeoJSON method
    if ('toGeoJSON' in layer && typeof layer.toGeoJSON === 'function') {
      const geoJson = (layer as L.FeatureGroup).toGeoJSON();
      console.log('Created geometry:', geoJson);
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
