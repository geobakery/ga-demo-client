import React, { useState } from 'react';
import { LatLngExpression } from 'leaflet';
import Header from './components/Header';
import Map from './components/Map';
import APICall from './components/APICall';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import './App.css';

const App: React.FC = () => {
  const [userGeometries, setUserGeometries] = useState<Feature<Geometry>[]>([]);
  const [apiGeometries, setApiGeometries] = useState<Feature<Geometry>[]>([]);
  const initialPosition: LatLngExpression = [51.009504, 13.806652];
  const initialZoom: number = 13;

  const addUserGeometries = (
    newGeometries: Feature<Geometry, GeoJsonProperties>[],
  ) => {
    setUserGeometries([...userGeometries, ...newGeometries]);
  };

  const addApiGeometries = (
    newGeometries: Feature<Geometry, GeoJsonProperties>[],
  ) => {
    setApiGeometries([...apiGeometries, ...newGeometries]);
  };

  const clearGeometries = () => {
    setUserGeometries([]);
    setApiGeometries([]);
  };

  return (
    <div className="app-container">
      <div className='header'>
      <Header />
      </div>
      <div className='map-container'>
      <Map
        initialPosition={initialPosition}
        initialZoom={initialZoom}
        userGeometries={userGeometries}
        setUserGeometries={addUserGeometries}
        apiGeometries={apiGeometries}
        clearGeometries={clearGeometries}
      /></div>
      <div className='sidebar'>
      <APICall
        userGeometries={userGeometries}
        addApiGeometries={addApiGeometries}
      /></div>
    </div>
  );
};

export default App;
