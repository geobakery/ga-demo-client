// Strip trailing slashes so appending an endpoint path never produces a
// double slash. Tolerates a missing value (env not set) by returning an
// empty string instead of throwing.
export function normalizeApiUrl(url: string | undefined): string {
  return (url ?? '').trim().replace(/\/+$/, '');
}
