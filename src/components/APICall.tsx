import React, { useEffect, useState } from 'react';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import {
  INTERFACES,
  INTERFACE_PARAMETER_MAPPING,
  INTERFACE_DEFAULT_PARAMETERS,
  DEFAULT_INTERFACE,
  DEFAULT_API_URL,
} from '../config/config';
import { Topic, TopicDefinitionOutside, toTopic } from '../utils/topics';
import { normalizeApiUrl, resolveApiUrl } from '../utils/apiUrl';

interface APICallProps {
  userGeometries: Feature<Geometry>[];
  addApiGeometries: (geometries: Feature<Geometry>[]) => void;
}

const APICall: React.FC<APICallProps> = ({
  userGeometries,
  addApiGeometries,
}) => {
  const [result, setResult] = useState('');
  const [apiUrl, setApiUrl] = useState<string>(resolveApiUrl(DEFAULT_API_URL));
  const [apiUrlDraft, setApiUrlDraft] = useState<string>(
    resolveApiUrl(DEFAULT_API_URL),
  );
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [topicsStatus, setTopicsStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
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

  // Load the available topics whenever the applied API URL changes. An
  // AbortController makes sure a slower in-flight request can't overwrite the
  // result of a newer one (last requested wins, not last resolved).
  useEffect(() => {
    const controller = new AbortController();

    // apiUrl is only ever a fetch() target (never script/innerHTML), so a
    // non-http scheme can't execute and no scheme check is needed.
    fetch(`${apiUrl}/topics`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: TopicDefinitionOutside[]) => {
        setTopics(data.map(toTopic));
        setTopicsError(null);
        setTopicsStatus('success');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return; // superseded by a newer request
        console.error('Failed to load topics', error);
        setTopics([]);
        setTopicsError(
          `Failed to load topics: ${error instanceof Error ? error.message : String(error)}`,
        );
        setTopicsStatus('error');
      });

    return () => controller.abort();
  }, [apiUrl]);

  // Apply the edited API URL: reset the topic selection and let the effect
  // above reload the available topics from the new URL.
  const applyApiUrl = () => {
    setSelectedTopics([]);
    setApiUrl(normalizeApiUrl(apiUrlDraft));
  };

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
    const filteredTopics = topics
      .filter((topic) => topic.interfaces.includes(selectedValue))
      .map((topic) => topic.identifier);
    setSelectedTopics(
      selectedTopics.filter((topic) => filteredTopics.includes(topic)),
    );
  };

  const handleTopicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedTopics((prev) =>
      checked ? [...prev, value] : prev.filter((topic) => topic !== value),
    );
  };

  const toggleGeometryCheckbox = () => {
    const newValue = !returnGeometryChecked;
    setReturnGeometryChecked(newValue);

    setParameterValues((prev) => ({
      ...prev,
      returnGeometry: newValue,
    }));
  };

  // Build the request (URL + body) from the current selections. Shared by the
  // live query preview and the actual send so both always match.
  const buildRequest = () => {
    // valuesAtPoint only accepts point geometries; drop everything else.
    const inputGeometries =
      selectedInterface === 'valuesAtPoint'
        ? userGeometries.filter(
            (geometry) => geometry.geometry.type === 'Point',
          )
        : userGeometries;

    const body: Record<string, unknown> = {
      topics: selectedTopics,
      inputGeometries,
      outputFormat: 'geojson',
      returnGeometry: returnGeometryChecked,
      outSRS: 4326,
      ...parameterValues, // Insert dynamic parameters
    };

    return { url: `${apiUrl}/${selectedInterface}`, body };
  };

  const sendGeometryToAPI = () => {
    if (userGeometries.length === 0) {
      console.error('No geometries to send');
      setResult('No geometries to send. Please draw one.');
      return;
    }

    const { url, body } = buildRequest();

    if (
      selectedInterface === 'valuesAtPoint' &&
      (body.inputGeometries as Feature<Geometry>[]).length === 0
    ) {
      console.error('ValuesAtPoint requires a point geometry');
      setResult(
        'ValuesAtPoint requires a point geometry. Please draw a marker.',
      );
      return;
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data: Feature<Geometry, GeoJsonProperties>[]) => {
        // Process the response
        console.log(`Sending request to ${url} with body`, body);
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
  const availableTopics = topics.filter((topic) =>
    topic.interfaces.includes(selectedInterface),
  );

  // While the typed URL differs from the applied one, show a "pending" state
  const apiUrlStatus =
    normalizeApiUrl(apiUrlDraft) !== apiUrl ? 'pending' : topicsStatus;
  const apiUrlPending = apiUrlStatus === 'pending';

  // Live preview of what Send would post, rebuilt from current selections.
  const { url: previewUrl, body: previewBody } = buildRequest();
  const requestPreview = `POST ${previewUrl}\n\n${JSON.stringify(previewBody, undefined, 2)}`;

  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <h2>GeospatialAnalyzer Playground</h2>
        <p>Draw a geometry on the map and query the API.</p>
      </header>
      <div className="sidebar-content">
        <fieldset>
          <legend>API URL</legend>
          <div className="api-url-row">
            <input
              type="text"
              name="apiUrl"
              className={`api-url-input api-url-input--${apiUrlStatus}`}
              value={apiUrlDraft}
              onChange={(e) => setApiUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyApiUrl();
              }}
            />
            <button
              type="button"
              className="btn--apply-api-url"
              onClick={applyApiUrl}
              title={
                apiUrlPending ? 'Apply URL and load topics' : 'Reload topics'
              }
              aria-label={
                apiUrlPending ? 'Apply URL and load topics' : 'Reload topics'
              }
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {apiUrlPending ? (
                  // Checkmark: confirm the typed URL and fetch topics from it
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  // Reload: re-fetch topics from the unchanged URL
                  <>
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <polyline points="21 3 21 8 16 8" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {topicsError && <p className="api-url-error">{topicsError}</p>}
        </fieldset>
      </div>
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
          {availableTopics.length === 0 ? (
            <p className="topic-empty">No topics available.</p>
          ) : (
            <div className="topic-checkbox-list">
              {availableTopics.map((topic) => (
                <label key={topic.identifier} className="topic-checkbox">
                  <input
                    type="checkbox"
                    name="selectedTopics"
                    value={topic.identifier}
                    checked={selectedTopics.includes(topic.identifier)}
                    onChange={handleTopicChange}
                  />
                  <span>{topic.identifier}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>
      {activeParameters.length > 0 && (
        <div className="sidebar-content">
          <fieldset>
            <legend>Set Parameters</legend>
            {activeParameters.includes('returnGeometry') && (
              <div className="parameter-row">
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
              <div className="parameter-row">
                <input
                  id="count"
                  type="number"
                  value={parameterValues.count ?? 5}
                  onChange={(e) =>
                    handleParameterChange('count', Number(e.target.value))
                  }
                />
                <label htmlFor="count">Count</label>
              </div>
            )}

            {activeParameters.includes('maxDistanceToNeighbour') && (
              <div className="parameter-row">
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
                <label htmlFor="maxDistanceToNeighbour">
                  Max Distance to Neighbour (meters)
                </label>
              </div>
            )}
          </fieldset>
        </div>
      )}
      <div className="sidebar-content">
        <details className="query-preview">
          <summary>Request preview</summary>
          <pre className="query-preview__body">{requestPreview}</pre>
        </details>
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
