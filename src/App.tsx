import React, { useState } from 'react';
import { LatLngExpression } from 'leaflet';
import Map from './components/Map';
import APICall from './components/APICall';
import { Feature, Geometry } from 'geojson';
import './App.css';

const App: React.FC = () => {
  const [geometries, setGeometries] = useState<Feature<Geometry>[]>([]);
  const initialPosition: LatLngExpression = [51.05089, 13.73832];
  const initialZoom: number = 13;

  return (
    <div className="app-container">
      <Map
        initialPosition={initialPosition}
        initialZoom={initialZoom}
        setGeometries={setGeometries}
      />
      <APICall geometries={geometries} />
    </div>
  );
};

export default App;
