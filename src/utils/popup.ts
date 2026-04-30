import type { GeoJsonProperties } from 'geojson';

// CVE-2025-69993: Leaflet v1.9.4 bindPopup is prone to Cross-Site-Scripting (XSS) when given HTML strings.
// Build the DOM via createElement/textContent so no value ever reaches innerHTML.
const URL_PATTERN = /^https?:\/\//i;

const emptyNode = (text: string): HTMLElement => {
  const span = document.createElement('span');
  span.className = 'popup-empty';
  span.textContent = text;
  return span;
};

const objectToTable = (obj: Record<string, unknown>): HTMLElement => {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return emptyNode('{}');
  }
  const table = document.createElement('table');
  table.className = 'popup-table';
  const tbody = document.createElement('tbody');
  for (const [key, value] of entries) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = key;
    const td = document.createElement('td');
    td.appendChild(valueToNode(value));
    tr.appendChild(th);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
};

const valueToNode = (value: unknown): Node => {
  if (value === null || value === undefined) {
    return emptyNode('—');
  }
  if (typeof value === 'string') {
    if (URL_PATTERN.test(value)) {
      const a = document.createElement('a');
      a.href = value;
      a.textContent = value;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      return a;
    }
    return document.createTextNode(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return document.createTextNode(String(value));
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return emptyNode('[]');
    }
    const ul = document.createElement('ul');
    ul.className = 'popup-list';
    for (const item of value) {
      const li = document.createElement('li');
      li.appendChild(valueToNode(item));
      ul.appendChild(li);
    }
    return ul;
  }
  if (typeof value === 'object') {
    return objectToTable(value as Record<string, unknown>);
  }
  return document.createTextNode(String(value));
};

export const propertiesToElement = (
  properties: GeoJsonProperties | null | undefined,
): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'popup-properties';
  if (!properties || Object.keys(properties).length === 0) {
    root.classList.add('popup-empty');
    root.textContent = '(keine Attribute)';
    return root;
  }
  root.appendChild(objectToTable(properties as Record<string, unknown>));
  return root;
};
