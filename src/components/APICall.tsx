import React, { useEffect, useState } from 'react';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import {
  INTERFACES,
  INTERFACE_PARAMETER_MAPPING,
  DEFAULT_INTERFACE,
  DEFAULT_API_URL,
  type InterfaceName,
  type RequestParameters,
} from '../config/config';
import {
  Topic,
  TopicDefinitionOutside,
  toTopic,
  topicTooltip,
} from '../utils/topics';
import { normalizeApiUrl, resolveApiUrl } from '../utils/apiUrl';
import { buildRequest, validateGeometries } from '../utils/request';
import {
  selectInterface,
  topicsForInterface,
} from '../utils/interfaceSelection';

interface APICallProps {
  userGeometries: Feature<Geometry>[];
  addApiGeometries: (geometries: Feature<Geometry>[]) => void;
}

// Parameter state on application start, derived like any interface switch.
const INITIAL_SELECTION = selectInterface(DEFAULT_INTERFACE, [], []);

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
    useState<InterfaceName>(DEFAULT_INTERFACE);
  const [returnGeometryChecked, setReturnGeometryChecked] = useState(
    INITIAL_SELECTION.returnGeometry,
  );
  const [parameterValues, setParameterValues] = useState<RequestParameters>(
    INITIAL_SELECTION.parameterValues,
  );

  // Parameters the user can edit for the selected interface
  const activeParameters = INTERFACE_PARAMETER_MAPPING[selectedInterface];

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

  // Remove empty values so the parameter is omitted from the request.
  const handleParameterChange = (
    key: keyof RequestParameters,
    value: string,
  ) => {
    setParameterValues((prev) => {
      const next = { ...prev };
      if (value === '') {
        delete next[key];
      } else {
        next[key] = Number(value);
      }
      return next;
    });
  };

  const handleInterfaceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    // The select only allows valid InterfaceName values.
    const nextInterface = event.target.value as InterfaceName;
    const selection = selectInterface(nextInterface, topics, selectedTopics);
    setSelectedInterface(nextInterface);
    setParameterValues(selection.parameterValues);
    setReturnGeometryChecked(selection.returnGeometry);
    setSelectedTopics(selection.selectedTopics);
  };

  const handleTopicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setSelectedTopics((prev) =>
      checked ? [...prev, value] : prev.filter((topic) => topic !== value),
    );
  };

  const toggleGeometryCheckbox = () => {
    setReturnGeometryChecked((prev) => !prev);
  };

  // Shared by the request preview and the actual send so both always match.
  const currentRequest = () =>
    buildRequest({
      apiUrl,
      interfaceName: selectedInterface,
      topics: selectedTopics,
      geometries: userGeometries,
      returnGeometry: returnGeometryChecked,
      parameters: parameterValues,
    });

  const sendGeometryToAPI = () => {
    const problem = validateGeometries(selectedInterface, userGeometries);
    if (problem) {
      console.error(problem);
      setResult(problem);
      return;
    }

    const { url, body } = currentRequest();

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Status line, blank line, API error body (indented if JSON)
          const text = await response.text();
          let details = text;
          try {
            details = JSON.stringify(JSON.parse(text), undefined, 4);
          } catch {
            // not JSON, keep the raw text
          }
          // statusText may be empty with HTTP/2
          const status =
            `HTTP ${response.status} ${response.statusText}`.trimEnd();
          throw new Error(details ? `${status}\n\n${details}` : status);
        }
        return response.json();
      })
      .then((data: Feature<Geometry, GeoJsonProperties>[]) => {
        setResult(JSON.stringify(data, undefined, 4));

        if (returnGeometryChecked) {
          addApiGeometries(data);
        }
      })
      .catch((error) => {
        console.error('Request failed', error);
        setResult(
          `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  };

  const availableTopics = topicsForInterface(selectedInterface, topics);

  // While the typed URL differs from the applied one, show a "pending" state
  const apiUrlStatus =
    normalizeApiUrl(apiUrlDraft) !== apiUrl ? 'pending' : topicsStatus;
  const apiUrlPending = apiUrlStatus === 'pending';

  // Live preview of what Send would post, rebuilt from current selections.
  const { url: previewUrl, body: previewBody } = currentRequest();
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
                <label
                  key={topic.identifier}
                  className="topic-checkbox"
                  title={topicTooltip(topic)}
                >
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
                  value={parameterValues.count ?? ''}
                  onChange={(e) =>
                    handleParameterChange('count', e.target.value)
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
                  value={parameterValues.maxDistanceToNeighbour ?? ''}
                  onChange={(e) =>
                    handleParameterChange(
                      'maxDistanceToNeighbour',
                      e.target.value,
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
