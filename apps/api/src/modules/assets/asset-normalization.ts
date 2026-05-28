export const normalizeTicker = (ticker: string) =>
  ticker
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9.-]/g, "");

export const buildLegacyTicker = (id: string) =>
  `LEGACY-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
