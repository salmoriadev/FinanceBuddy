const CHART_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;
const CHART_COLOR_PATTERNS = [
  /^#[0-9A-Fa-f]{3,8}$/,
  /^var\(--[A-Za-z0-9_-]+\)$/,
  /^(rgb|rgba|hsl|hsla)\([0-9A-Za-z.,% /+-]+\)$/,
  /^(rgb|rgba|hsl|hsla)\(var\(--[A-Za-z0-9_-]+\)\)$/,
];

export const CHART_THEMES = { light: "", dark: ".dark" } as const;

export type ChartThemeName = keyof typeof CHART_THEMES;
export type ChartStyleItem = {
  color?: string;
  theme?: Record<ChartThemeName, string>;
};

export function getSafeChartStyleRules(
  id: string,
  colorConfig: Array<[string, ChartStyleItem]>,
) {
  const safeChartId = id.replace(/[^A-Za-z0-9_-]/g, "");
  if (!safeChartId || !colorConfig.length) {
    return "";
  }

  return Object.entries(CHART_THEMES)
    .map(([theme, prefix]) => {
      const declarations = colorConfig
        .map(([key, itemConfig]) => {
          const color =
            itemConfig.theme?.[theme as ChartThemeName] || itemConfig.color;

          if (!isSafeChartKey(key) || !isSafeChartColor(color)) {
            return null;
          }

          return `  --color-${key}: ${color};`;
        })
        .filter(Boolean)
        .join("\n");

      if (!declarations) {
        return null;
      }

      return `${prefix} [data-chart="${safeChartId}"] {\n${declarations}\n}`;
    })
    .filter(Boolean)
    .join("\n");
}

function isSafeChartKey(key: string) {
  return CHART_KEY_PATTERN.test(key);
}

function isSafeChartColor(color?: string) {
  if (!color) {
    return false;
  }

  return (
    color.length <= 80 &&
    !/[;{}<>\\]/.test(color) &&
    CHART_COLOR_PATTERNS.some((pattern) => pattern.test(color))
  );
}
