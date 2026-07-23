import { describe, expect, it } from 'vitest';
import { propertiesToElement } from './popup';

// These tests guard the mitigation for CVE-2025-69993 (Leaflet bindPopup XSS):
// no property value or key may ever be interpreted as HTML.

describe('propertiesToElement — empty input', () => {
  it('renders a placeholder for null properties', () => {
    const root = propertiesToElement(null);
    expect(root.classList.contains('popup-empty')).toBe(true);
    expect(root.textContent).toBe('(keine Attribute)');
  });

  it('renders a placeholder for undefined properties', () => {
    expect(propertiesToElement(undefined).textContent).toBe(
      '(keine Attribute)',
    );
  });

  it('renders a placeholder for an empty object', () => {
    expect(propertiesToElement({}).textContent).toBe('(keine Attribute)');
  });
});

describe('propertiesToElement — escaping', () => {
  it('never turns a value into markup', () => {
    const root = propertiesToElement({
      name: '<img src=x onerror=alert(1)>',
    });
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(root.innerHTML).toContain('&lt;img');
  });

  it('never turns a key into markup', () => {
    const root = propertiesToElement({ '<script>x</script>': 'value' });
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('th')?.textContent).toBe('<script>x</script>');
  });

  it('escapes values nested in arrays and objects', () => {
    const root = propertiesToElement({
      list: ['<b>bold</b>'],
      nested: { inner: '<i>italic</i>' },
    });
    expect(root.querySelector('b')).toBeNull();
    expect(root.querySelector('i')).toBeNull();
    expect(root.textContent).toContain('<b>bold</b>');
    expect(root.textContent).toContain('<i>italic</i>');
  });
});

describe('propertiesToElement — links', () => {
  it('turns an http(s) value into a safe external link', () => {
    const link = propertiesToElement({
      url: 'https://example.org/page',
    }).querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.org/page');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link?.textContent).toBe('https://example.org/page');
  });

  it('does not link a javascript: url', () => {
    const root = propertiesToElement({ url: 'javascript:alert(1)' });
    expect(root.querySelector('a')).toBeNull();
    expect(root.textContent).toContain('javascript:alert(1)');
  });

  it('does not link other non-http schemes', () => {
    const root = propertiesToElement({ url: 'data:text/html,<script>' });
    expect(root.querySelector('a')).toBeNull();
  });
});

describe('propertiesToElement — value rendering', () => {
  it('renders a key/value row', () => {
    const root = propertiesToElement({ gemarkung: 'Dresden' });
    expect(root.querySelector('th')?.textContent).toBe('gemarkung');
    expect(root.querySelector('td')?.textContent).toBe('Dresden');
  });

  it('renders numbers and booleans as text', () => {
    const root = propertiesToElement({ count: 5, valid: false });
    const cells = [...root.querySelectorAll('td')].map((td) => td.textContent);
    expect(cells).toEqual(['5', 'false']);
  });

  it('renders a dash for null and undefined values', () => {
    const root = propertiesToElement({ a: null, b: undefined });
    const cells = [...root.querySelectorAll('td')].map((td) => td.textContent);
    expect(cells).toEqual(['—', '—']);
  });

  it('renders arrays as a list', () => {
    const root = propertiesToElement({ tags: ['a', 'b'] });
    const items = [...root.querySelectorAll('ul.popup-list li')].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(['a', 'b']);
  });

  it('marks an empty array and an empty object', () => {
    const root = propertiesToElement({ list: [], obj: {} });
    const cells = [...root.querySelectorAll('td')].map((td) => td.textContent);
    expect(cells).toEqual(['[]', '{}']);
  });

  it('renders nested objects as a nested table', () => {
    const root = propertiesToElement({ nested: { inner: 'value' } });
    const inner = root.querySelector('td table.popup-table');
    expect(inner?.querySelector('th')?.textContent).toBe('inner');
    expect(inner?.querySelector('td')?.textContent).toBe('value');
  });
});
