import React, { useState } from 'react';
import { Feature, Geometry } from 'geojson';

interface APICallProps {
  geometries: Feature<Geometry>[];
}

const APICall: React.FC<APICallProps> = ({ geometries }) => {
  const [result, setResult] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('within');
  const [returnGeometryChecked, setChecked] = React.useState(false);

  const handleInterfaceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedInterface(event.target.value);
  };

  const handleTopicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      event.target.selectedOptions,
      (option) => option.value,
    );
    setSelectedTopics(selectedOptions);
  };

  const toggleGeometryCheckbox = () => {
    setChecked(!returnGeometryChecked);
  };

  const sendGeometryToAPI = () => {
    if (geometries.length === 0) {
      console.error('No geometries to send');
      setResult('No geometries to send');
      return;
    }

    const bodyContent = {
      topics: selectedTopics,
      inputGeometries: geometries,
      outputFormat: 'geojson',
      returnGeometry: returnGeometryChecked,
      outSRS: 4326,
    };

    fetch('http://localhost:3000/v1/' + selectedInterface, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyContent),
    })
      .then((response) => response.json())
      .then((data) => {
        // Process the response
        console.log(
          'Request with interface: ' +
            JSON.stringify(selectedInterface) +
            ' and body: ' +
            JSON.stringify(bodyContent),
        );
        setResult(JSON.stringify(data, undefined, 4));
      })
      .catch((error) => {
        console.error('Error sending geometry to API:', error);
      });
  };

  return (
    <div className="sidebar">
      <h2>API Call</h2>
      <div className="sidebar-content">
        <fieldset>
          <legend>Choose Interface</legend>
          <label>
            <select
              name="selectedInterface"
              multiple={false}
              onChange={handleInterfaceChange}
            >
              <option value="within">Within</option>
              <option value="intersect">Intersect</option>
            </select>
          </label>
        </fieldset>
      </div>
      <div className="sidebar-content">
        <fieldset>
          <legend>Choose Topic(s)</legend>
          <label>
            <select
              name="selectedTopics"
              multiple={true}
              onChange={handleTopicChange}
            >
              <option value="land">Land</option>
              <option value="kreis">Kreis</option>
              <option value="gemeinde">Gemeinde</option>
              <option value="gemarkung">Gemarkung</option>
              <option value="flurstueck">Flurstück</option>
            </select>
          </label>
        </fieldset>
      </div>
      <div className="sidebar-content">
        <fieldset>
          <legend>Set Parameters</legend>
          <label>
            <input
              type="checkbox"
              checked={returnGeometryChecked}
              onChange={toggleGeometryCheckbox}
            />
            Return Geometry
          </label>
        </fieldset>
      </div>
      <div className="sidebar-content">
        <button onClick={sendGeometryToAPI}>Send Geometry to API</button>
      </div>
      <textarea value={result} readOnly cols={50} rows={15} />
    </div>
  );
};

export default APICall;
