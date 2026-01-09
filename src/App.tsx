import React, { useState } from 'react';
import Map from './components/Map';
import { INITIAL_POSITION, INITIAL_ZOOM } from './config/config';
import APICall from './components/APICall';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import './App.css';

const App: React.FC = () => {
  const [userGeometries, setUserGeometries] = useState<Feature<Geometry>[]>([]);
  const [apiGeometries, setApiGeometries] = useState<Feature<Geometry>[]>([]);

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
      <Map
        initialPosition={INITIAL_POSITION}
        initialZoom={INITIAL_ZOOM}
        userGeometries={userGeometries}
        setUserGeometries={addUserGeometries}
        apiGeometries={apiGeometries}
        clearGeometries={clearGeometries}
      />
      <APICall
        userGeometries={userGeometries}
        addApiGeometries={addApiGeometries}
      />
    </div>
  );
};

export default App;
