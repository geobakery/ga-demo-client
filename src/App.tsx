import React, { useState } from 'react';
import Map from './components/Map';
import { INITIAL_POSITION, INITIAL_ZOOM } from './config/config';
import APICall from './components/APICall';
import FeatureInfo from './components/FeatureInfo';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import './App.css';

const App: React.FC = () => {
  const [userGeometries, setUserGeometries] = useState<Feature<Geometry>[]>([]);
  const [apiGeometries, setApiGeometries] = useState<
    Feature<Geometry, GeoJsonProperties>[]
  >([]);
  // Properties of the clicked result geometry (shown below the map on
  // narrow screens instead of a popup).
  const [selectedFeature, setSelectedFeature] =
    useState<GeoJsonProperties>(null);

  const addApiGeometries = (
    newGeometries: Feature<Geometry, GeoJsonProperties>[],
  ) => {
    setApiGeometries((prev) => [...prev, ...newGeometries]);
  };

  const clearApiGeometries = () => {
    setApiGeometries([]);
  };

  return (
    <div className="app-container">
      <Map
        initialPosition={INITIAL_POSITION}
        initialZoom={INITIAL_ZOOM}
        setUserGeometries={setUserGeometries}
        apiGeometries={apiGeometries}
        clearApiGeometries={clearApiGeometries}
        onFeatureSelect={setSelectedFeature}
      />
      <FeatureInfo properties={selectedFeature} />
      <APICall
        userGeometries={userGeometries}
        addApiGeometries={addApiGeometries}
      />
    </div>
  );
};

export default App;
