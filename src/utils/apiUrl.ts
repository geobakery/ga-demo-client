// Strip trailing slashes so appending an endpoint path never produces a
// double slash. Tolerates a missing value (env not set) by returning an
// empty string instead of throwing.
export function normalizeApiUrl(url: string | undefined): string {
  return (url ?? '').trim().replace(/\/+$/, '');
}

// Resolve a possibly-relative configured URL against the document base so the
// field shows the actual request target (e.g. "/ga/v2" -> "https://host/ga/v2").
// Uses document.baseURI to match how fetch() resolves relative URLs. Already
// absolute URLs are returned unchanged.
export function resolveApiUrl(url: string | undefined): string {
  const normalized = normalizeApiUrl(url);
  if (!normalized) return '';
  try {
    return normalizeApiUrl(new URL(normalized, document.baseURI).href);
  } catch {
    return normalized;
  }
}
