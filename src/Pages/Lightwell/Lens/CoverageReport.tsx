import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import LightwellPageHeader from '../components/LightwellPageHeader';
import {
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Title,
  Truncate,
} from '@patternfly/react-core';
import { PlusIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import CoverageSummaryCard from './components/CoverageSummaryCard';
import EcosystemBreakdownCard from './components/EcosystemBreakdownCard';
import PackageCoverageTable from './components/PackageCoverageTable';
import RemediatedDataWarning from '../RemediatedDataWarning';
import { useCoverageReport } from './hooks/useCoverageReport';
import Loader from 'components/Loader';
import LightwellNotFound from '../components/LightwellNotFound';

const CoverageReport = () => {
  const { reportUUID } = useParams();
  const { filename, report, isLoading, isError, error, startOver } = useCoverageReport(reportUUID);

  const ecosystems = useMemo(
    () => report?.ecosystem_coverage_summary.map((summary) => summary.ecosystem) ?? [],
    [report],
  );

  if (isLoading) return <Loader />;
  if (isError) throw error;
  if (!report) return <LightwellNotFound />;

  const matchAnalysisTitle = filename ? (
    <Title headingLevel='h1'>
      Match analysis for manifest{' '}
      <strong>
        <span
          style={{
            display: 'inline-block',
            maxWidth: '24rem',
            verticalAlign: 'bottom',
          }}
        >
          <Truncate content={filename} position='middle' />
        </span>
      </strong>
    </Title>
  ) : (
    'Match analysis'
  );

  return (
    <>
      <LightwellPageHeader
        title={matchAnalysisTitle}
        ouiaId='lightwell-coverage-header'
        actions={
          <Button
            variant='secondary'
            icon={<PlusIcon />}
            ouiaId='lightwell-new-analysis-button'
            onClick={startOver}
          >
            New analysis
          </Button>
        }
      />
      {/* plXs matches the mXs margin LightwellPageHeader applies to its inner title flex, keeping content left-aligned */}
      <PageSection
        aria-label='Match analysis'
        hasBodyWrapper={false}
        className={`${spacing.pt_0} ${spacing.pbLg} ${spacing.pxLg} ${spacing.plXs}`}
      >
        <Stack hasGutter style={{ maxWidth: 1200, gap: '3rem' }}>
          <StackItem>
            <CoverageSummaryCard report={report} />
          </StackItem>
          <StackItem>
            <EcosystemBreakdownCard report={report} />
          </StackItem>
          <StackItem>
            <Card isGlass>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                  <FlexItem>
                    <RemediatedDataWarning />
                  </FlexItem>
                  <FlexItem>
                    <PackageCoverageTable uuid={report.uuid} ecosystems={ecosystems} />
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default CoverageReport;
