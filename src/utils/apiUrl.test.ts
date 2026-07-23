import { describe, expect, it } from 'vitest';
import { normalizeApiUrl, resolveApiUrl } from './apiUrl';

// The document URL is pinned in vite.config.ts:
// https://example.org/ga/demo-map/

describe('normalizeApiUrl', () => {
  it('returns an empty string when the env value is missing', () => {
    expect(normalizeApiUrl(undefined)).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeApiUrl('  https://example.org/ga/v2  ')).toBe(
      'https://example.org/ga/v2',
    );
  });

  it('strips trailing slashes so endpoints never produce a double slash', () => {
    expect(normalizeApiUrl('https://example.org/ga/v2/')).toBe(
      'https://example.org/ga/v2',
    );
    expect(normalizeApiUrl('https://example.org/ga/v2///')).toBe(
      'https://example.org/ga/v2',
    );
  });

  it('leaves a url without a trailing slash untouched', () => {
    expect(normalizeApiUrl('/ga/v2')).toBe('/ga/v2');
  });
});

describe('resolveApiUrl', () => {
  it('returns an empty string for a missing value', () => {
    expect(resolveApiUrl(undefined)).toBe('');
    expect(resolveApiUrl('')).toBe('');
  });

  it('resolves a root-relative url against the document base', () => {
    expect(resolveApiUrl('/ga/v2')).toBe('https://example.org/ga/v2');
  });

  it('resolves a document-relative url against the base path', () => {
    expect(resolveApiUrl('v2')).toBe('https://example.org/ga/demo-map/v2');
  });

  it('leaves an absolute url unchanged', () => {
    expect(resolveApiUrl('https://api.example.com/ga/v2')).toBe(
      'https://api.example.com/ga/v2',
    );
  });

  it('normalizes the resolved url as well', () => {
    expect(resolveApiUrl('https://api.example.com/ga/v2/')).toBe(
      'https://api.example.com/ga/v2',
    );
  });
});
