import React, { useEffect, useRef, useState } from 'react';
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
  addApiGeometries: (
    geometries: Feature<Geometry, GeoJsonProperties>[],
  ) => void;
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

  const [requestHasShadow, setRequestHasShadow] = useState(false);

  const [showApiUrl, setShowApiUrl] = useState(false);
  const apiConnectionRef = useRef<HTMLDivElement>(null);

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

  // Close the API URL window on a click anywhere outside of it (or Escape).
  // The connection button belongs to the container, so it can still toggle.
  useEffect(() => {
    if (!showApiUrl) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!apiConnectionRef.current?.contains(event.target as Node)) {
        setShowApiUrl(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowApiUrl(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showApiUrl]);

  useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    const actionArea = document.querySelector('.sidebar-request');

    if (!sidebar || !actionArea) return;

    const contentElements = Array.from(
      sidebar.querySelectorAll<HTMLElement>('.sidebar-content'),
    );

    const updateShadow = () => {
      const actionRect = actionArea.getBoundingClientRect();

      const overlaps = contentElements.some((element) => {
        const rect = element.getBoundingClientRect();

        return rect.bottom > actionRect.top && rect.top < actionRect.bottom;
      });

      setRequestHasShadow(overlaps);
    };

    updateShadow();

    sidebar.addEventListener('scroll', updateShadow, { passive: true });
    window.addEventListener('resize', updateShadow);

    const resizeObserver = new ResizeObserver(updateShadow);

    // The request area's size can change, e.g. when the preview
    // is opened/closed.
    resizeObserver.observe(actionArea);

    // Content areas can also change their size when the selected
    // interface changes and parameters appear/disappear.
    contentElements.forEach((element) => {
      resizeObserver.observe(element);
    });

    return () => {
      sidebar.removeEventListener('scroll', updateShadow);
      window.removeEventListener('resize', updateShadow);
      resizeObserver.disconnect();
    };
  }, []);

  // Apply the edited API URL: reset the topic selection and let the effect
  // above reload the available topics from the new URL.
  const applyApiUrl = () => {
    setSelectedTopics([]);
    setApiUrl(normalizeApiUrl(apiUrlDraft));
  };

  type NumericParameterKey = Exclude<
    keyof RequestParameters,
    'returnBufferGeometry'
  >;

  const handleParameterChange = (key: NumericParameterKey, value: string) => {
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

  const handleBufferGeometryChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setParameterValues((prev) => ({
      ...prev,
      returnBufferGeometry: event.target.checked,
    }));
  };

  const supportsBuffer = (interfaceName: InterfaceName) => {
    const parameters = INTERFACE_PARAMETER_MAPPING[interfaceName];

    return (
      parameters.includes('buffer') &&
      parameters.includes('returnBufferGeometry')
    );
  };

  const handleInterfaceChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    // The select only allows valid InterfaceName values.
    const nextInterface = event.target.value as InterfaceName;

    const selection = selectInterface(nextInterface, topics, selectedTopics, {
      interfaceName: selectedInterface,
      parameterValues,
      returnGeometry: returnGeometryChecked,
    });

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

        if (
          returnGeometryChecked ||
          parameterValues.returnBufferGeometry === true
        ) {
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

  const applyButtonLabel = apiUrlPending
    ? 'Apply URL and load topics'
    : 'Reload topics';

  // Live preview of what Send would post, rebuilt from current selections.
  const { url: previewUrl, body: previewBody } = currentRequest();
  const requestPreview = `POST ${previewUrl}\n\n${JSON.stringify(previewBody, undefined, 2)}`;

  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <div className="sidebar-header-main">
          <div className="sidebar-header-title">
            <h1>GeospatialAnalyzer Playground</h1>
            <p>Demo Client for the API.</p>
          </div>

          <div className="api-connection" ref={apiConnectionRef}>
            <button
              type="button"
              className={`api-connection-button${showApiUrl ? ' is-open' : ''}`}
              onClick={() => setShowApiUrl((prev) => !prev)}
              aria-label="API connection settings"
              aria-expanded={showApiUrl}
              title="API connection settings"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>

            {showApiUrl && (
              <div className="api-connection-panel">
                <button
                  type="button"
                  className="api-connection-close"
                  onClick={() => setShowApiUrl(false)}
                  aria-label="Close API connection settings"
                  title="Close"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
                <fieldset>
                  <legend>API URL</legend>

                  <div className="api-url-row">
                    <div
                      className={`api-url-input-wrapper api-url-input-wrapper--${apiUrlStatus}`}
                    >
                      <input
                        type="text"
                        name="apiUrl"
                        className="api-url-input"
                        value={apiUrlDraft}
                        onChange={(e) => setApiUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyApiUrl();
                        }}
                      />
                      <span className="api-url-status" />
                    </div>

                    <button
                      type="button"
                      className="btn--apply-api-url"
                      onClick={applyApiUrl}
                      title={applyButtonLabel}
                      aria-label={applyButtonLabel}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        {apiUrlPending ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <polyline points="21 3 21 8 16 8" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>

                  {topicsError && (
                    <p className="api-url-error">{topicsError}</p>
                  )}
                </fieldset>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="sidebar-content">
        <h3>Analysis</h3>
        <p>Configure your spatial query.</p>

        <fieldset>
          <legend>Choose Tool</legend>
          <select
            name="selectedInterface"
            value={selectedInterface}
            onChange={handleInterfaceChange}
          >
            {INTERFACES.map((iface) => (
              <option key={iface} value={iface}>
                {iface}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend>Set Parameters</legend>
          {activeParameters.length > 0 ? (
            <>
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
                    Max. Distance to Neighbour [m]
                  </label>
                </div>
              )}

              {activeParameters.includes('returnGeometry') && (
                <div className="parameter-row">
                  <input
                    id="returnGeometry"
                    type="checkbox"
                    checked={returnGeometryChecked}
                    onChange={toggleGeometryCheckbox}
                  />
                  <label htmlFor="returnGeometry">Return Result Geometry</label>
                </div>
              )}
            </>
          ) : (
            <p className="empty">Not supported by the selected tool.</p>
          )}
        </fieldset>
      </div>

      <div className="sidebar-content">
        <h3>Input</h3>
        <p>Draw a geometry on the map.</p>

        <fieldset>
          <legend>Buffer</legend>

          {supportsBuffer(selectedInterface) ? (
            <>
              <div className="parameter-row">
                <input
                  id="buffer"
                  type="number"
                  min="0"
                  value={parameterValues.buffer ?? ''}
                  onChange={(e) =>
                    handleParameterChange('buffer', e.target.value)
                  }
                />
                <label htmlFor="buffer">Buffer Distance [m]</label>
              </div>

              <div className="parameter-row">
                <input
                  id="returnBufferGeometry"
                  type="checkbox"
                  checked={parameterValues.returnBufferGeometry ?? false}
                  onChange={handleBufferGeometryChange}
                />
                <label htmlFor="returnBufferGeometry">
                  Return Buffer Geometry
                </label>
              </div>
            </>
          ) : (
            <p className="empty">Not supported by the selected tool.</p>
          )}
        </fieldset>
      </div>

      <div className="sidebar-content sidebar-content--topics">
        <h3>Topics</h3>
        <p>Select the available datasets to query.</p>
        <fieldset>
          {availableTopics.length === 0 ? (
            <p className="empty">No topics available.</p>
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

      <div
        className={`sidebar-request${requestHasShadow ? ' sidebar-request--shadow' : ''}`}
      >
        <details className="query-preview">
          <summary>Request preview</summary>
          <pre className="query-preview__body">{requestPreview}</pre>
        </details>

        <button className="btn--send-geometry" onClick={sendGeometryToAPI}>
          Send Request to API
        </button>
      </div>

      <div className="sidebar-content sidebar-content--response">
        <h3>Response</h3>
        <p>Click on features in the map to view their properties.</p>

        <fieldset>
          <textarea value={result} readOnly cols={50} rows={15} />
        </fieldset>
      </div>
    </div>
  );
};

export default APICall;
