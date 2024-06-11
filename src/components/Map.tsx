import React from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Define the props interface
interface MapProps {
  initialPosition: LatLngExpression;
  initialZoom: number;
}

// Define the state interface
interface MapState {
  position: LatLngExpression;
  zoom: number;
}

class Map extends React.Component<MapProps, MapState> {
  render() {
    return (
      <div className="map-container">
        <MapContainer
          center={this.props.initialPosition}
          zoom={this.props.initialZoom}
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
    );
  }
}

export default Map;
