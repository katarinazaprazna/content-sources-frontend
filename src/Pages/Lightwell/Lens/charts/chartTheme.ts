import { chart_color_purple_100 } from '@patternfly/react-tokens/dist/esm/chart_color_purple_100';
import { chart_color_purple_300 } from '@patternfly/react-tokens/dist/esm/chart_color_purple_300';
import { chart_color_green_100 } from '@patternfly/react-tokens/dist/esm/chart_color_green_100';
import { chart_color_green_300 } from '@patternfly/react-tokens/dist/esm/chart_color_green_300';
import { chart_skeleton_ColorScale_400 } from '@patternfly/react-tokens/dist/esm/chart_skeleton_ColorScale_400';

import type { CoverageMatchStatus } from 'services/Lightwell/CoverageReportsApi';

// Keys must match `$lw-ecosystem-colors` in styles/lightwell-coverage-charts.scss
export const SUPPORTED_ECOSYSTEMS = {
  java: { label: 'Java' },
  python: { label: 'Python' },
} as const;

export type SupportedEcosystemKey = keyof typeof SUPPORTED_ECOSYSTEMS;

export const COLOR_KEY_BY_LABEL = new Map<string, SupportedEcosystemKey>(
  Object.entries(SUPPORTED_ECOSYSTEMS).map(([key, { label }]) => [
    label,
    key as SupportedEcosystemKey,
  ]),
);

export const UNMATCHED_FILL = chart_skeleton_ColorScale_400.var;

export const DONUT_COLOR_SCALE = [
  chart_color_green_300.var,
  chart_color_green_100.var,
  UNMATCHED_FILL,
];

const FALLBACK_SHADES = {
  exact: chart_color_purple_300.var,
  partial: chart_color_purple_100.var,
};

export const getEcosystemMatchColor = (
  ecosystem: string,
  matchStatus: Exclude<CoverageMatchStatus, 'none'>,
): string => {
  const key = COLOR_KEY_BY_LABEL.get(ecosystem);
  if (!key) return FALLBACK_SHADES[matchStatus];
  return `var(--lw-color-${key}-${matchStatus})`;
};
