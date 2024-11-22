import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
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
  setUserGeometries: (geometries: Feature<Geometry>[]) => void;
  userGeometries: Feature<Geometry>[];
  apiGeometries: Feature<Geometry>[];
  clearGeometries: () => void;
}

const Map: React.FC<MapProps> = ({
  initialPosition,
  initialZoom,
  setUserGeometries,
  userGeometries,
  apiGeometries,
  clearGeometries,
}) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  const onEdited = (e: DrawEvents.Edited) => {
    const layers = e.layers;
    const newGeometries: Feature<Geometry>[] = [];

    layers.eachLayer((layer: L.Layer) => {
      if ('toGeoJSON' in layer && typeof layer.toGeoJSON === 'function') {
        const geoJson = (layer as L.FeatureGroup).toGeoJSON();
        newGeometries.push(geoJson as Feature<Geometry>);
      } else {
        console.error('Layer does not support toGeoJSON method');
      }
    });

    console.log('Edited geometries:', newGeometries);
    setUserGeometries(newGeometries);
  };

  const onCreated = (e: CreatedEvent) => {
    const { layer } = e;

    // Check that the layer is a FeatureLayer that has the toGeoJSON method
    if ('toGeoJSON' in layer && typeof layer.toGeoJSON === 'function') {
      const geoJson = (layer as L.FeatureGroup).toGeoJSON();
      console.log('Created geometry:', geoJson);
      setUserGeometries([...userGeometries, geoJson as Feature<Geometry>]);
    } else {
      console.error('Layer does not support toGeoJSON method');
    }
  };

  const onDeleted = () => {
    clearGeometries();
  };

  useEffect(() => {
    if (featureGroupRef.current) {
      //featureGroupRef.current.clearLayers();
      //[...userGeometries, ...apiGeometries].forEach((geometry) => {
      [...apiGeometries].forEach((geometry) => {
        const layer = L.geoJSON(geometry);
        layer.addTo(featureGroupRef.current!);
        console.log('Returned geometry added to map:', geometry);
      });
    }
    //  }, [userGeometries, apiGeometries]);
  }, [apiGeometries]);

  const convertToLatLng = (positions: number[][]): LatLngExpression[] => {
    return positions.map((position) => {
      return [position[0], position[1]] as LatLngExpression;
    });
  };

  const polygonBBPositions: number[][] = [
    [50.952162, 13.666581],
    [50.952162, 13.946723],
    [51.066846, 13.946723],
    [51.066846, 13.666581],
  ];

  const polygonPositions: LatLngExpression[] =
    convertToLatLng(polygonBBPositions);

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
        <Polygon
          positions={polygonPositions}
          color="gray"
          fillColor="transparent"
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
              edit: false,
            }}
            onEdited={onEdited}
            onCreated={onCreated}
            onDeleted={onDeleted}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default Map;
