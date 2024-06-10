import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import './App.css';

const App: React.FC = () => {
  const position: LatLngExpression = [51.05089, 13.73832];

  return (
    <div className="app-container">
      <div className="map-container">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FeatureGroup>
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
            />
          </FeatureGroup>
        </MapContainer>
      </div>
      <div className="sidebar">
        <h2>Sidebar</h2>
        <p></p>
      </div>
    </div>
  );
};

export default App;
