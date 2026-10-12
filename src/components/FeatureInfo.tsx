import React, { useEffect, useRef } from 'react';
import { GeoJsonProperties } from 'geojson';
import { propertiesToElement } from '../utils/popup';

interface FeatureInfoProps {
  properties: GeoJsonProperties;
}

// Properties of the clicked map feature, shown below the map on narrow
// screens in the same structure as the map popups (see utils/popup).
const FeatureInfo: React.FC<FeatureInfoProps> = ({ properties }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.replaceChildren(propertiesToElement(properties));
  }, [properties]);

  if (!properties) return null;

  return (
    <details
      // Keyed by content so a newly clicked feature opens the block again.
      key={JSON.stringify(properties)}
      className="query-preview feature-info"
      open
    >
      <summary>Feature Properties</summary>
      <div ref={containerRef} className="query-preview__body feature-info__body" />
    </details>
  );
};

export default FeatureInfo;
