import React, { useState } from 'react';
import { Feature, Geometry } from 'geojson';

interface APICallProps {
  geometries: Feature<Geometry>[];
}

const APICall: React.FC<APICallProps> = ({ geometries }) => {
  const [result, setResult] = useState('');

  const sendGeometryToAPI = () => {
    if (geometries.length === 0) {
      console.error('No geometries to send');
      return;
    }

    const bodyContent = {
      topics: ['kreis'],
      inputGeometries: geometries,
      outputFormat: 'geojson',
      returnGeometry: false,
      outSRS: 4326,
    };

    fetch('http://localhost:3000/v1/within', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyContent),
    })
      .then((response) => response.json())
      .then((data) => {
        // Verarbeite das zurückgegebene Ergebnis hier
        setResult(JSON.stringify(data, undefined, 4));
      })
      .catch((error) => {
        console.error('Error sending geometry to API:', error);
      });
  };

  return (
    <div className="sidebar">
      <h2>API Call</h2>
      <p>
        <button onClick={sendGeometryToAPI}>Send geometry to API</button>
      </p>
      <textarea
        value={result}
        readOnly
        cols={50}
        rows={15}
        defaultValue="Result"
      />
    </div>
  );
};

export default APICall;
