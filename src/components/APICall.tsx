import React, { useState } from 'react';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
const apiUrl = import.meta.env.VITE_API_URL;
const apiPort = import.meta.env.VITE_API_PORT ? `:${import.meta.env.VITE_API_PORT}` : '';
const apiVersion = import.meta.env.VITE_API_VERSION ? `/${import.meta.env.VITE_API_VERSION}` : '';

interface APICallProps {
  userGeometries: Feature<Geometry>[];
  addApiGeometries: (geometries: Feature<Geometry>[]) => void;
}

const APICall: React.FC<APICallProps> = ({
  userGeometries,
  addApiGeometries,
}) => {
  const [result, setResult] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('within');
  const [returnGeometryChecked, setChecked] = React.useState(false);

  const mostlyUsedSpatialTests: string[] = [
    'within',
    'intersect',
    'nearestNeighbour',
  ];

  const topicInterfaceMapping: Record<string, string[]> = {
    land: mostlyUsedSpatialTests,
    kreis: mostlyUsedSpatialTests,
    gemeinde: mostlyUsedSpatialTests,
    gemarkung: mostlyUsedSpatialTests,
    flurstueck: mostlyUsedSpatialTests,
    schutzgebiet: mostlyUsedSpatialTests,
    wasserschutzgebiet: mostlyUsedSpatialTests,
    natura2000_gebiet: mostlyUsedSpatialTests,
    natura2000_ort: ['intersect', 'nearestNeighbour'],
    'hohlraum-bergaufsicht': mostlyUsedSpatialTests,
    'hohlraum-unterirdisch': mostlyUsedSpatialTests,
    'asp-sperrzone': mostlyUsedSpatialTests,
    adresse: ['intersect', 'nearestNeighbour'],
    hoehe: ['valuesAtPoint'],
    th_verwaltungseinheit: mostlyUsedSpatialTests,
  };

  const handleInterfaceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedValue = event.target.value;
    setSelectedInterface(selectedValue);

    // Filter the topics based on the selected interface
    const filteredTopics = Object.keys(topicInterfaceMapping).filter((topic) =>
      topicInterfaceMapping[topic].includes(selectedValue),
    );

    // Update selected topics to only include valid ones
    const validSelectedTopics = selectedTopics.filter((topic) =>
      filteredTopics.includes(topic),
    );
    setSelectedTopics(validSelectedTopics);
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
    if (userGeometries.length === 0) {
      console.error('No geometries to send');
      setResult('No geometries to send');
      return;
    }

    const bodyContent = {
      topics: selectedTopics,
      inputGeometries: userGeometries,
      outputFormat: 'geojson',
      returnGeometry: returnGeometryChecked,
      outSRS: 4326,
    };

    const url = `${apiUrl}${apiPort}${apiVersion}/${selectedInterface}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyContent),
    })
      .then((response) => response.json())
      .then((data: Feature<Geometry, GeoJsonProperties>[]) => {
        // Process the response
        console.log(
          'Request with interface: ' +
            JSON.stringify(selectedInterface) +
            ' and body: ' +
            JSON.stringify(bodyContent),
        );
        setResult(JSON.stringify(data, undefined, 4));

        if (returnGeometryChecked) {
          addApiGeometries(data);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // Get the list of topics that are valid for the selected interface
  const availableTopics = Object.keys(topicInterfaceMapping).filter((topic) =>
    topicInterfaceMapping[topic].includes(selectedInterface),
  );

  return (
    <div className="sidebar">
      <h2>API Call</h2>
      <div className="sidebar-content">
        <fieldset>
          <legend>Choose Interface</legend>
          <label>
            <select
              name="selectedInterface"
              value={selectedInterface}
              multiple={false}
              onChange={handleInterfaceChange}
            >
              <option value="within">Within</option>
              <option value="intersect">Intersect</option>
              <option value="nearestNeighbour">NearestNeighbour</option>
              <option value="valuesAtPoint">ValuesAtPoint</option>
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
              value={selectedTopics}
              onChange={handleTopicChange}
            >
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
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
        <button className="btn--send-geometry" onClick={sendGeometryToAPI}>
          Send Geometry to API
        </button>
      </div>
      <textarea value={result} readOnly cols={50} rows={15} />
    </div>
  );
};

export default APICall;
