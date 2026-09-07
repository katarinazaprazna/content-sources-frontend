import { getEcosystemMatchColor, UNMATCHED_FILL } from './chartColors';
import type {
  CompletedCoverageReport,
  CoverageMatchStatus,
  EcosystemCoverageSummary,
} from 'services/Lightwell/CoverageReportsApi';

export const ECOSYSTEM_CHART_MIN_WIDTH = 500;
export const ECOSYSTEM_CHART_PADDING = { bottom: 65, left: 100, right: 20, top: 10 };
export const ECOSYSTEM_CHART_DOMAIN_PADDING = { x: [15, 15] as [number, number] };

export const CATEGORY_AXIS_STYLE = { tickLabels: { fontSize: 14 } };
export const COUNT_AXIS_STYLE = {
  tickLabels: { fontSize: 14 },
  axisLabel: { fontSize: 14, padding: 50 },
};

export const getEcosystemBarChartHeight = (ecosystemCount: number): number =>
  75 + ecosystemCount * 55;

export type EcosystemBarDatum = {
  x: string;
  y: number;
  fill: string;
};

export type EcosystemChartLegendItem = {
  id: CoverageMatchStatus;
  name: string;
  fills: string[];
};

type EcosystemChartModel = {
  exactPackages: EcosystemBarDatum[];
  partialPackages: EcosystemBarDatum[];
  unmatchedPackages: EcosystemBarDatum[];
  ecosystems: string[];
};

const toBarSeries = (
  summaries: EcosystemCoverageSummary[],
  getCount: (eco: EcosystemCoverageSummary) => number,
  getFill: (eco: EcosystemCoverageSummary) => string,
): EcosystemBarDatum[] =>
  summaries.map((eco) => ({
    x: eco.ecosystem,
    y: getCount(eco),
    fill: getFill(eco),
  }));

export const getEcosystemChartModel = (report: CompletedCoverageReport): EcosystemChartModel => {
  const summaries = report.ecosystem_coverage_summary;

  return {
    exactPackages: toBarSeries(
      summaries,
      (eco) => eco.exact_matches,
      (eco) => getEcosystemMatchColor(eco.ecosystem, 'exact'),
    ),
    partialPackages: toBarSeries(
      summaries,
      (eco) => eco.partial_matches,
      (eco) => getEcosystemMatchColor(eco.ecosystem, 'partial'),
    ),
    unmatchedPackages: toBarSeries(
      summaries,
      (eco) => eco.unmatched,
      () => UNMATCHED_FILL,
    ),
    ecosystems: summaries.map((eco) => eco.ecosystem),
  };
};

export const formatIntegerTicks = (tick: number): string =>
  Number.isInteger(tick) ? tick.toString() : '';

export const getLegendItems = (ecosystems: string[]): EcosystemChartLegendItem[] => [
  {
    id: 'exact',
    name: 'Exact match',
    fills: ecosystems.map((ecosystem) => getEcosystemMatchColor(ecosystem, 'exact')),
  },
  {
    id: 'partial',
    name: 'Partial match',
    fills: ecosystems.map((ecosystem) => getEcosystemMatchColor(ecosystem, 'partial')),
  },
  {
    id: 'none',
    name: 'No match',
    fills: [UNMATCHED_FILL],
  },
];

export type EcosystemChartA11yTable = {
  columns: string[];
  rows: { ecosystem: string; values: number[] }[];
};

export const getEcosystemChartA11yTable = (model: EcosystemChartModel): EcosystemChartA11yTable => {
  const legendItems = getLegendItems(model.ecosystems);

  const seriesByLegendId = {
    exact: model.exactPackages,
    partial: model.partialPackages,
    none: model.unmatchedPackages,
  };

  return {
    columns: legendItems.map((item) => item.name),
    rows: model.ecosystems.map((ecosystem, index) => ({
      ecosystem,
      values: legendItems.map((item) => seriesByLegendId[item.id][index].y),
    })),
  };
};
