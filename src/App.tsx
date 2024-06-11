import React from 'react';
import { LatLngExpression } from 'leaflet';
import Map from './components/Map.tsx';
import Sidebar from './components/Sidebar.tsx';
import './App.css';

interface AppProps {
  // Define any props here, if necessary
}

interface AppState {
  // Define any state here, if necessary
}

class App extends React.Component<AppProps, AppState> {
  render() {
    const initialPosition: LatLngExpression = [51.05089, 13.73832];
    const initialZoom: number = 13;

    return (
      <div className="app-container">
        <Map initialPosition={initialPosition} initialZoom={initialZoom} />
        <Sidebar />
      </div>
    );
  }
}
export default App;
