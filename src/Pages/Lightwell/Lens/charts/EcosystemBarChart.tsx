import { Content, Flex, FlexItem } from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartStack,
  ChartTooltip,
  type ChartBarProps,
} from '@patternfly/react-charts/victory';
import { useMemo, type CSSProperties, type Ref } from 'react';

import {
  CATEGORY_AXIS_STYLE,
  COUNT_AXIS_STYLE,
  ECOSYSTEM_CHART_DOMAIN_PADDING,
  ECOSYSTEM_CHART_PADDING,
  formatIntegerTicks,
  getEcosystemChartModel,
  getLegendItems,
  type EcosystemBarDatum,
  type EcosystemChartA11yTable,
  type EcosystemChartLegendItem,
  getEcosystemChartA11yTable,
} from './ecosystemBarModel';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';

type EcosystemBarChartBase = {
  report: CompletedCoverageReport;
  width: number;
  height: number;
};

export type EcosystemBarChartWebProps = EcosystemBarChartBase & {
  surface?: 'web';
  containerRef: Ref<HTMLDivElement>;
};

export type EcosystemBarChartPdfProps = EcosystemBarChartBase & {
  surface: 'pdf';
};

export type EcosystemBarChartProps = EcosystemBarChartWebProps | EcosystemBarChartPdfProps;

const LEGEND_SWATCH_SIZE = 12;
const BAR_STYLE: ChartBarProps['style'] = {
  data: { fill: ({ datum }) => (datum as EcosystemBarDatum).fill },
};

const getBarTooltipProps = (kind: string, showTooltips: boolean) => {
  if (!showTooltips) {
    return {};
  }

  return {
    labelComponent: <ChartTooltip constrainToVisibleArea />,
    labels: ({ datum }: { datum: EcosystemBarDatum }) =>
      datum.y > 0 ? `${datum.x} ${kind}: ${datum.y}` : null,
  };
};

const getLegendSwatchStyle = (fill: string): CSSProperties => ({
  display: 'block',
  width: LEGEND_SWATCH_SIZE,
  height: LEGEND_SWATCH_SIZE,
  backgroundColor: fill,
});

type ChartLegendProps = {
  items: EcosystemChartLegendItem[];
};

const ChartLegend = ({ items }: ChartLegendProps) => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
    {items.map(({ name, fills }) => (
      <FlexItem key={name}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
          <FlexItem>
            <Content component='p'>{name}</Content>
          </FlexItem>
          <FlexItem>
            <Flex gap={{ default: 'gapXs' }}>
              {fills.map((fill, index) => (
                <FlexItem key={`${name}-${index}`}>
                  <span style={getLegendSwatchStyle(fill)} />
                </FlexItem>
              ))}
            </Flex>
          </FlexItem>
        </Flex>
      </FlexItem>
    ))}
  </Flex>
);

const ChartA11yTable = ({ columns, rows }: EcosystemChartA11yTable) => (
  <div className='pf-v6-screen-reader'>
    <table>
      <caption>Package matches by ecosystem</caption>
      <thead>
        <tr>
          <th scope='col'>Ecosystem</th>
          {columns.map((column) => (
            <th key={column} scope='col'>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ ecosystem, values }) => (
          <tr key={ecosystem}>
            <th scope='row'>{ecosystem}</th>
            {columns.map((column, index) => (
              <td key={column}>{values[index]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const EcosystemBarChart = (props: EcosystemBarChartProps) => {
  const { report, width, height } = props;
  const isPdf = props.surface === 'pdf';

  // Web (default): tooltips, responsive-width container, no legend. PDF: no tooltips, fixed size, legend
  const showTooltips = !isPdf;
  const showLegend = isPdf;
  const containerRef = isPdf ? undefined : props.containerRef;

  const model = useMemo(() => getEcosystemChartModel(report), [report]);
  const { exactPackages, partialPackages, unmatchedPackages, ecosystems } = model;

  const plot = (
    <div ref={containerRef} aria-hidden style={isPdf ? undefined : { width: '100%' }}>
      <Chart
        horizontal
        domainPadding={ECOSYSTEM_CHART_DOMAIN_PADDING}
        height={height}
        width={width}
        padding={ECOSYSTEM_CHART_PADDING}
      >
        <ChartAxis style={CATEGORY_AXIS_STYLE} />
        <ChartAxis
          dependentAxis
          tickFormat={formatIntegerTicks}
          showGrid
          style={COUNT_AXIS_STYLE}
          label={showLegend ? 'Packages' : undefined}
        />
        <ChartStack>
          <ChartBar
            data={exactPackages}
            style={BAR_STYLE}
            {...getBarTooltipProps('exact match', showTooltips)}
          />
          <ChartBar
            data={partialPackages}
            style={BAR_STYLE}
            {...getBarTooltipProps('partial match', showTooltips)}
          />
          <ChartBar
            data={unmatchedPackages}
            style={BAR_STYLE}
            {...getBarTooltipProps('no match', showTooltips)}
          />
        </ChartStack>
      </Chart>
    </div>
  );

  if (!isPdf) {
    // SVG charts are not screen-reader-friendly, so we include an extra table summarizing the data
    const a11yTable = getEcosystemChartA11yTable(model);

    return (
      <>
        {plot}
        <ChartA11yTable {...a11yTable} />
      </>
    );
  }

  return (
    <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
        {plot}
      </FlexItem>
      <FlexItem>
        <ChartLegend items={getLegendItems(ecosystems)} />
      </FlexItem>
    </Flex>
  );
};

export default EcosystemBarChart;
