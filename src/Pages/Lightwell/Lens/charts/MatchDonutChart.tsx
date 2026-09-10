import { ChartDonut, ChartLabel, ChartThemeColor } from '@patternfly/react-charts/victory';
import { useMemo, type Ref } from 'react';

import { DONUT_COLOR_SCALE } from './chartColors';
import {
  COVERAGE_DONUT_PADDING,
  COVERAGE_DONUT_TITLE_LINE_HEIGHT,
  getDonutData,
  getDonutLabel,
  getMatchedPackagePercentage,
} from './matchDonutModel';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type MatchDonutChartBase = {
  report: CompletedCoverageReport;
  width: number;
  height: number;
};

export type MatchDonutChartWebProps = MatchDonutChartBase & {
  surface?: 'web';
  containerRef: Ref<HTMLDivElement>;
};

export type MatchDonutChartPdfProps = MatchDonutChartBase & {
  surface: 'pdf';
};

export type MatchDonutChartProps = MatchDonutChartWebProps | MatchDonutChartPdfProps;

const MatchDonutChart = (props: MatchDonutChartProps) => {
  const { report, width, height } = props;
  const isPdf = props.surface === 'pdf';

  const showTooltips = !isPdf;
  const containerRef = isPdf ? undefined : props.containerRef;
  const percentage = getMatchedPackagePercentage(report);
  const donutData = useMemo(() => getDonutData(report), [report]);

  const chart = (
    <ChartDonut
      ariaDesc='Match summary donut chart'
      constrainToVisibleArea
      data={donutData}
      colorScale={DONUT_COLOR_SCALE}
      themeColor={ChartThemeColor.green}
      allowTooltip={showTooltips}
      labels={showTooltips ? getDonutLabel : undefined}
      title={`${percentage}%`}
      subTitle='packages matched'
      titleComponent={<ChartLabel lineHeight={COVERAGE_DONUT_TITLE_LINE_HEIGHT} />}
      width={width}
      height={height}
      padding={COVERAGE_DONUT_PADDING}
    />
  );

  if (!isPdf) {
    return <div ref={containerRef}>{chart}</div>;
  }

  return chart;
};

export default MatchDonutChart;
