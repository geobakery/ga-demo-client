import React, { useState, useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { BOUNDING_BOX } from '../config/config';

const BBOX_LABEL_ICON = L.divIcon({
  className: 'bbox-label-anchor',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  html: '',
});

const BBOX_MIN_LAT = Math.min(...BOUNDING_BOX.map((p) => p[0]));
const BBOX_MAX_LAT = Math.max(...BOUNDING_BOX.map((p) => p[0]));
const BBOX_MIN_LNG = Math.min(...BOUNDING_BOX.map((p) => p[1]));
const BBOX_MAX_LNG = Math.max(...BOUNDING_BOX.map((p) => p[1]));

type BboxLabelAnchor = {
  key: 'n' | 's' | 'w' | 'e';
  position: LatLngExpression;
  direction: 'top' | 'bottom' | 'left' | 'right';
};

const computeVisibleBboxAnchors = (map: L.Map): BboxLabelAnchor[] => {
  const bounds = map.getBounds();
  const vMinLat = bounds.getSouth();
  const vMaxLat = bounds.getNorth();
  const vMinLng = bounds.getWest();
  const vMaxLng = bounds.getEast();

  const lngLo = Math.max(BBOX_MIN_LNG, vMinLng);
  const lngHi = Math.min(BBOX_MAX_LNG, vMaxLng);
  const latLo = Math.max(BBOX_MIN_LAT, vMinLat);
  const latHi = Math.min(BBOX_MAX_LAT, vMaxLat);

  const horizontalVisible = lngLo < lngHi;
  const verticalVisible = latLo < latHi;
  const lngMid = (lngLo + lngHi) / 2;
  const latMid = (latLo + latHi) / 2;

  const anchors: BboxLabelAnchor[] = [];
  if (horizontalVisible && BBOX_MAX_LAT >= vMinLat && BBOX_MAX_LAT <= vMaxLat) {
    anchors.push({
      key: 'n',
      position: [BBOX_MAX_LAT, lngMid],
      direction: 'top',
    });
  }
  if (horizontalVisible && BBOX_MIN_LAT >= vMinLat && BBOX_MIN_LAT <= vMaxLat) {
    anchors.push({
      key: 's',
      position: [BBOX_MIN_LAT, lngMid],
      direction: 'bottom',
    });
  }
  if (verticalVisible && BBOX_MIN_LNG >= vMinLng && BBOX_MIN_LNG <= vMaxLng) {
    anchors.push({
      key: 'w',
      position: [latMid, BBOX_MIN_LNG],
      direction: 'left',
    });
  }
  if (verticalVisible && BBOX_MAX_LNG >= vMinLng && BBOX_MAX_LNG <= vMaxLng) {
    anchors.push({
      key: 'e',
      position: [latMid, BBOX_MAX_LNG],
      direction: 'right',
    });
  }
  return anchors;
};

const BboxLabels: React.FC = () => {
  const map = useMap();
  const [anchors, setAnchors] = useState<BboxLabelAnchor[]>(() =>
    computeVisibleBboxAnchors(map),
  );

  useEffect(() => {
    const update = () => setAnchors(computeVisibleBboxAnchors(map));
    map.on('move', update);
    map.on('zoom', update);
    return () => {
      map.off('move', update);
      map.off('zoom', update);
    };
  }, [map]);

  return (
    <>
      {anchors.map((anchor) => (
        <Marker
          key={anchor.key}
          position={anchor.position}
          icon={BBOX_LABEL_ICON}
          interactive={false}
        >
          <Tooltip
            permanent
            direction={anchor.direction}
            className="bbox-label"
          >
            Demo Data Bounding Box
          </Tooltip>
        </Marker>
      ))}
    </>
  );
};

export default BboxLabels;
