import React, { useEffect, useState } from 'react';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import {
  topicInterfaceMapping,
  INTERFACE_PARAMETER_MAPPING,
  INTERFACE_DEFAULT_PARAMETERS,
  INTERFACES,
  DEFAULT_INTERFACE,
  TOPIC_LABELS,
} from '../config/config';
const apiUrl = import.meta.env.VITE_API_URL;

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
  const [selectedInterface, setSelectedInterface] =
    useState<string>(DEFAULT_INTERFACE);
  const [returnGeometryChecked, setReturnGeometryChecked] =
    React.useState(true);
  const [activeParameters, setActiveParameters] = useState<string[]>([]);

  interface ParameterValues {
    count?: number;
    maxDistanceToNeighbour?: number;
    returnGeometry?: boolean;
  }

  const [parameterValues, setParameterValues] = useState<ParameterValues>({});

  // Init parameters
  useEffect(() => {
    setActiveParameters(INTERFACE_PARAMETER_MAPPING[selectedInterface] ?? []);
  }, [selectedInterface]);

  // Change parameter state automaticly
  const handleParameterChange = (key: string, value: string | number) => {
    setParameterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInterfaceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedValue = event.target.value;
    setSelectedInterface(selectedValue);

    const parameters = INTERFACE_PARAMETER_MAPPING[selectedValue] ?? [];
    setActiveParameters(parameters);

    // Use default parameter values from config
    const defaults = INTERFACE_DEFAULT_PARAMETERS[selectedValue] ?? {};
    setParameterValues(defaults);

    if ('returnGeometry' in defaults) {
      const dg = defaults as Record<string, unknown>;
      if (dg.returnGeometry !== undefined) {
        setReturnGeometryChecked(Boolean(dg.returnGeometry));
      }
    } else if (selectedValue === 'valuesAtPoint') {
      setReturnGeometryChecked(false);
    }

    // Filter topics
    const filteredTopics = Object.keys(topicInterfaceMapping).filter((topic) =>
      topicInterfaceMapping[topic].includes(selectedValue),
    );
    setSelectedTopics(
      selectedTopics.filter((topic) => filteredTopics.includes(topic)),
    );
  };

  const handleTopicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      event.target.selectedOptions,
      (option) => option.value,
    );
    setSelectedTopics(selectedOptions);
  };

  const toggleGeometryCheckbox = () => {
    const newValue = !returnGeometryChecked;
    setReturnGeometryChecked(newValue);

    setParameterValues((prev) => ({
      ...prev,
      returnGeometry: newValue,
    }));
  };

  const sendGeometryToAPI = () => {
    if (userGeometries.length === 0) {
      console.error('No geometries to send');
      setResult('No geometries to send. Please draw one.');
      return;
    }

    // Only allow point geometry for 'valuesAtPoint'
    let inputGeometries = userGeometries;

    if (selectedInterface === 'valuesAtPoint') {
      inputGeometries = userGeometries.filter(
        (geometry) => geometry.geometry.type === 'Point',
      );

      if (inputGeometries.length === 0) {
        console.error('ValuesAtPoint requires a point geometry');
        setResult(
          'ValuesAtPoint requires a point geometry. Please draw a marker.',
        );
        return;
      }
    }

    const bodyContent: Record<string, unknown> = {
      topics: selectedTopics,
      inputGeometries: userGeometries,
      outputFormat: 'geojson',
      returnGeometry: returnGeometryChecked,
      outSRS: 4326,
      ...parameterValues, // Insert dynamic parameters
    };

    const url = `${apiUrl}/${selectedInterface}`;

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
          `Sending request using interface ${JSON.stringify(selectedInterface)} and body ${JSON.stringify(bodyContent)}`,
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
              {INTERFACES.map((iface) => (
                <option key={iface} value={iface}>
                  {iface}
                </option>
              ))}
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
                  {TOPIC_LABELS[topic] ?? topic}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      </div>
      <div className="sidebar-content">
        <fieldset>
          <legend>Set Parameters</legend>
          {activeParameters.includes('returnGeometry') && (
            <div>
              <input
                id="returnGeometry"
                type="checkbox"
                checked={returnGeometryChecked}
                onChange={toggleGeometryCheckbox}
              />
              <label htmlFor="returnGeometry">Return Geometry</label>
            </div>
          )}

          {activeParameters.includes('count') && (
            <div>
              <input
                id="count"
                type="number"
                value={parameterValues.count ?? 5}
                onChange={(e) =>
                  handleParameterChange('count', Number(e.target.value))
                }
              />
              <label htmlFor="count" className="lbl--parameter">
                Count
              </label>
            </div>
          )}

          {activeParameters.includes('maxDistanceToNeighbour') && (
            <div>
              <input
                id="maxDistanceToNeighbour"
                type="number"
                value={parameterValues.maxDistanceToNeighbour ?? 2000}
                onChange={(e) =>
                  handleParameterChange(
                    'maxDistanceToNeighbour',
                    Number(e.target.value),
                  )
                }
              />
              <label
                htmlFor="maxDistanceToNeighbour"
                className="lbl--parameter"
              >
                Max Distance to Neighbour (meters)
              </label>
            </div>
          )}
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
