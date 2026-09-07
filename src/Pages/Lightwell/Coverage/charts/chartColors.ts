import { chart_color_purple_100 } from '@patternfly/react-tokens/dist/esm/chart_color_purple_100';
import { chart_color_purple_300 } from '@patternfly/react-tokens/dist/esm/chart_color_purple_300';
import { chart_color_green_100 } from '@patternfly/react-tokens/dist/esm/chart_color_green_100';
import { chart_color_green_300 } from '@patternfly/react-tokens/dist/esm/chart_color_green_300';
import { chart_skeleton_ColorScale_400 } from '@patternfly/react-tokens/dist/esm/chart_skeleton_ColorScale_400';

import type { CoverageMatchStatus } from 'services/Lightwell/CoverageReportsApi';

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

// Keep in sync with `$lw-ecosystem-colors` in styles/lightwell-coverage-charts.scss
// CSS remaps --lw-color-{key}-exact / -partial under .pf-v6-theme-dark
const SUPPORTED_ECOSYSTEMS = new Set(['java', 'python']);

const ecosystemColorKey = (ecosystem: string): string | undefined => {
  const key = ecosystem.trim().toLowerCase();
  return SUPPORTED_ECOSYSTEMS.has(key) ? key : undefined;
};

export const getEcosystemMatchColor = (
  ecosystem: string,
  matchStatus: Exclude<CoverageMatchStatus, 'none'>,
): string => {
  const key = ecosystemColorKey(ecosystem);
  if (!key) return FALLBACK_SHADES[matchStatus];
  return `var(--lw-color-${key}-${matchStatus})`;
};
