import { chart_color_purple_100 } from '@patternfly/react-tokens/dist/esm/chart_color_purple_100';
import { chart_color_purple_300 } from '@patternfly/react-tokens/dist/esm/chart_color_purple_300';
import { chart_donut_label_subtitle_Fill } from '@patternfly/react-tokens/dist/esm/chart_donut_label_subtitle_Fill';
import { chart_donut_label_title_Fill } from '@patternfly/react-tokens/dist/esm/chart_donut_label_title_Fill';
import { chart_global_FontSize_2xl } from '@patternfly/react-tokens/dist/esm/chart_global_FontSize_2xl';
import { chart_global_FontSize_sm } from '@patternfly/react-tokens/dist/esm/chart_global_FontSize_sm';
import { t_global_border_color_nonstatus_gray_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_gray_default';
import { t_global_border_color_nonstatus_green_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_green_default';
import { t_global_border_color_nonstatus_yellow_default } from '@patternfly/react-tokens/dist/esm/t_global_border_color_nonstatus_yellow_default';
import { t_global_font_weight_body_default } from '@patternfly/react-tokens/dist/esm/t_global_font_weight_body_default';
import type { CSSProperties } from 'react';

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

// Label chip family (nonstatus). Border tokens read stronger in light; match fills in dark.
// Partial is yellow (not orange) so it does not collide with Java brand bars.
export const MATCH_STATUS_COLORS = {
  exact: t_global_border_color_nonstatus_green_default.var,
  partial: t_global_border_color_nonstatus_yellow_default.var,
  none: t_global_border_color_nonstatus_gray_default.var,
} as const;

export const UNMATCHED_FILL = MATCH_STATUS_COLORS.none;

export type MatchStatusColorKey = keyof typeof MATCH_STATUS_COLORS;

export const DONUT_COLOR_SCALE = [
  MATCH_STATUS_COLORS.exact,
  MATCH_STATUS_COLORS.partial,
  MATCH_STATUS_COLORS.none,
];

export const DONUT_TITLE_AND_SUBTITLE_STYLE: CSSProperties[] = [
  {
    fill: chart_donut_label_title_Fill.var,
    fontSize: chart_global_FontSize_2xl.value,
    fontWeight: t_global_font_weight_body_default.var,
  },
  {
    fill: chart_donut_label_subtitle_Fill.var,
    fontSize: chart_global_FontSize_sm.value,
  },
];

// Applied to unknown ecosystems (no backend mapping):
// https://github.com/content-services/content-sources-backend/blob/fea90711c14c715cae6ad9b13cfb397e3d2807a2/pkg/coverage/parser/parser.go#L11
const ECOSYSTEM_BAR_FALLBACK_COLORS = {
  exact: chart_color_purple_300.var,
  partial: chart_color_purple_100.var,
};

export const getEcosystemMatchColor = (
  ecosystem: string,
  matchStatus: Exclude<CoverageMatchStatus, 'none'>,
): string => {
  const key = COLOR_KEY_BY_LABEL.get(ecosystem);
  if (!key) return ECOSYSTEM_BAR_FALLBACK_COLORS[matchStatus];
  return `var(--lw-color-${key}-${matchStatus})`;
};
