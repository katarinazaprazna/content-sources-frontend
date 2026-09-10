import { Content, Flex, FlexItem, Title } from '@patternfly/react-core';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useMemo } from 'react';

import {
  COVERAGE_DONUT_WIDTH,
  getMatchedPackagePercentage,
  getMatchDonutChartHeight,
} from '../charts/matchDonutModel';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import MatchSummaryStats, { type MatchSummaryItem } from './MatchSummaryStats';
import MatchDonutChart from '../charts/MatchDonutChart';

type CoverageSummaryCardProps = {
  report: CompletedCoverageReport;
};

const getMatchSummaryItems = (report: CompletedCoverageReport): MatchSummaryItem[] => [
  {
    count: report.exact_matches,
    label: 'Exact match',
    tooltip: 'Package name and version found in the Lightwell Network catalog.',
  },
  {
    count: report.partial_matches,
    label: 'Partial match',
    tooltip: 'Package name found in the catalog, but not the specific version you are running.',
  },
  {
    count: report.unmatched,
    label: 'No match',
    tooltip:
      'Package not found in the Lightwell Network catalog. Unmatched packages are logged as demand signals, but do not guarantee a build.',
  },
];

const CoverageSummaryCard = ({ report }: CoverageSummaryCardProps) => {
  const { containerRef, width: chartWidth } = useContainerWidth(COVERAGE_DONUT_WIDTH);

  const percentage = getMatchedPackagePercentage(report);
  const matchSummaryItems = useMemo(() => getMatchSummaryItems(report), [report]);

  return (
    <Flex gap={{ default: 'gapXl' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem style={{ width: '100%', maxWidth: COVERAGE_DONUT_WIDTH }}>
        <MatchDonutChart
          report={report}
          containerRef={containerRef}
          width={chartWidth}
          height={getMatchDonutChartHeight(chartWidth)}
        />
      </FlexItem>
      <FlexItem flex={{ default: 'flex_1' }}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
          <FlexItem>
            <Title headingLevel='h3' size='2xl'>
              <strong>{percentage}%</strong> of packages match the Lightwell Network catalog
            </Title>
            <Content component='p' className={`${text.textColorSubtle} ${spacing.mtSm}`}>
              Applies to packages within supported ecosystems (see below).
            </Content>
          </FlexItem>
          <FlexItem>
            <MatchSummaryStats items={matchSummaryItems} />
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default CoverageSummaryCard;
