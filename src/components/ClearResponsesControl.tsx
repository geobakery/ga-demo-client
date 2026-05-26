import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface ClearResponsesControlProps {
  onClear: () => void;
}

const ClearResponsesControl: React.FC<ClearResponsesControlProps> = ({
  onClear,
}) => {
  const map = useMap();
  const onClearRef = useRef(onClear);

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  useEffect(() => {
    const ControlClass = L.Control.extend({
      onAdd: () => {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control clear-responses-control',
        );
        const link = L.DomUtil.create('a', '', container);
        link.href = '#';
        link.title = 'Clear Responses';
        link.setAttribute('role', 'button');
        link.setAttribute('aria-label', 'Clear Responses');
        link.textContent = '↺';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(link, 'click', (event) => {
          L.DomEvent.preventDefault(event);
          L.DomEvent.stopPropagation(event);
          onClearRef.current();
        });

        return container;
      },
    });

    const control = new ControlClass({ position: 'topright' });
    control.addTo(map);

    const moveToBottom = () => {
      const el = control.getContainer();
      const parent = el?.parentElement;
      if (el && parent && parent.lastElementChild !== el) {
        parent.appendChild(el);
      }
    };

    const parent = control.getContainer()?.parentElement ?? null;
    const observer = parent ? new MutationObserver(moveToBottom) : null;
    observer?.observe(parent!, { childList: true });

    return () => {
      observer?.disconnect();
      control.remove();
    };
  }, [map]);

  return null;
};

export default ClearResponsesControl;
