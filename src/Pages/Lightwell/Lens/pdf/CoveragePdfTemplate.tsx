import { Content, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { AsyncState } from '@redhat-cloud-services/types';

import type { CoverageMatchStatus } from 'services/Lightwell/CoverageReportsApi';
import { MATCH_STATUS_COLORS } from '../charts/chartTheme';
import { t_global_color_nonstatus_green_default } from '@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_green_default';
import { t_global_color_nonstatus_yellow_default } from '@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_yellow_default';
import { t_global_color_nonstatus_gray_default } from '@patternfly/react-tokens/dist/esm/t_global_color_nonstatus_gray_default';
import MatchDonutChart from '../charts/MatchDonutChart';
import EcosystemBarChart from '../charts/EcosystemBarChart';
import { getMatchDonutChartHeight, getMatchedPackagePercentage } from '../charts/matchDonutModel';
import { getEcosystemBarChartHeight } from '../charts/ecosystemBarModel';
import type { CoveragePdfAdditionalData, CoveragePdfData } from './coveragePdf';

type CoveragePdfTemplateProps = {
  asyncData: AsyncState<CoveragePdfData>;
  additionalData?: Partial<CoveragePdfAdditionalData>;
};

const PACKAGE_COLUMNS = ['Package', 'Version', 'Ecosystem', 'Match'] as const;

const MATCH_STATUS_LABEL: Record<CoverageMatchStatus, string> = {
  exact: 'Exact',
  partial: 'Partial',
  none: 'None',
};

const PILL_COLORS: Record<CoverageMatchStatus, string> = {
  exact: t_global_color_nonstatus_green_default.var,
  partial: t_global_color_nonstatus_yellow_default.var,
  none: t_global_color_nonstatus_gray_default.var,
};

const PDF_DONUT_WIDTH = 180;
const PDF_DONUT_HEIGHT = getMatchDonutChartHeight(PDF_DONUT_WIDTH);
const PDF_BAR_CHART_WIDTH = 700;

const STAT_COLORS: Record<CoverageMatchStatus, string> = {
  exact: MATCH_STATUS_COLORS.exact,
  partial: MATCH_STATUS_COLORS.partial,
  none: MATCH_STATUS_COLORS.none,
};

const CoveragePdfTemplate = ({ asyncData, additionalData }: CoveragePdfTemplateProps) => {
  const { data } = asyncData;
  const packages = data?.packages ?? [];
  const report = data?.report ?? null;
  const filename = additionalData?.filename;
  const generatedAt = additionalData?.generatedAt;
  const includeSummary = additionalData?.includeSummary !== false && !!report;

  return (
    <div className='coverage-pdf'>
      <style>{`
        .coverage-pdf {
          color: #151515;
          font-family: 'Red Hat Text', Helvetica, Arial, sans-serif;
          padding: 8px 0 16px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .coverage-pdf h1 { color: #c9190b; margin: 0 0 4px; font-size: 22px; }
        .coverage-pdf h2 { margin: 28px 0 12px; page-break-after: avoid; }
        .coverage-pdf .coverage-pdf-meta { color: #6a6e73; margin-bottom: 0; }
        .coverage-pdf .coverage-pdf-cover {
          display: flex;
          flex-direction: column;
          gap: 64px;
          min-height: 860px;
          padding: 8px 0;
        }
        .coverage-pdf .coverage-pdf-cover-header { margin-bottom: 16px; }
        .coverage-pdf .coverage-pdf-match-section h2 { margin: 0 0 8px; }
        .coverage-pdf .coverage-pdf-summary {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .coverage-pdf .coverage-pdf-summary-detail {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .coverage-pdf .coverage-pdf-summary-text { font-size: 14px; line-height: 1.5; }
        .coverage-pdf .coverage-pdf-summary-subtext { color: #6a6e73; font-size: 11px; }
        .coverage-pdf .coverage-pdf-stats {
          display: flex;
          gap: 24px;
        }
        .coverage-pdf .coverage-pdf-stat { text-align: center; }
        .coverage-pdf .coverage-pdf-stat-value { font-size: 24px; font-weight: 700; }
        .coverage-pdf .coverage-pdf-stat-bar {
          display: block;
          width: 2.5rem;
          height: 0.25rem;
          border-radius: 9999px;
          margin: 6px auto 0;
        }
        .coverage-pdf .coverage-pdf-stat-label { font-size: 11px; color: #6a6e73; margin-top: 6px; }
        .coverage-pdf .coverage-pdf-ecosystem-section { }
        .coverage-pdf .coverage-pdf-ecosystem-section h2 { margin: 0 0 8px; }
        .coverage-pdf .coverage-pdf-ecosystem-subtitle { margin-bottom: 12px; }
        .coverage-pdf .coverage-pdf-ecosystem-chart {
          page-break-inside: avoid;
          transform: scale(0.85);
          transform-origin: top left;
        }
        .coverage-pdf table,
        .coverage-pdf .pf-v6-c-table,
        .coverage-pdf .pf-v5-c-table {
          display: table;
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        .coverage-pdf thead { display: table-header-group; }
        .coverage-pdf tbody { display: table-row-group; }
        .coverage-pdf tr { display: table-row; page-break-inside: avoid; }
        .coverage-pdf th, .coverage-pdf td {
          display: table-cell;
          font-size: 10px;
          vertical-align: top;
        }
        .coverage-pdf th {
          background-color: #f0f0f0;
          font-weight: 700;
          padding: 8px 8px 6px;
          text-align: left;
        }
        .coverage-pdf td { padding: 6px 8px; }
        .coverage-pdf .coverage-pdf-table tbody tr:nth-child(even) td {
          background-color: #fafafa;
        }
        .coverage-pdf .coverage-pdf-col-package {
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .coverage-pdf .coverage-pdf-col-version,
        .coverage-pdf .coverage-pdf-col-ecosystem,
        .coverage-pdf .coverage-pdf-col-match {
          width: 1%;
          white-space: nowrap;
        }
        .coverage-pdf .coverage-pdf-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 400;
          padding: 2px 8px;
          border-radius: 9999px;
          color: #151515;
        }
      `}</style>
      {includeSummary && report ? (
        <>
          <div className='coverage-pdf-cover'>
            <div className='coverage-pdf-cover-header'>
              <Title headingLevel='h1' size='xl'>
                Lightwell Match Analysis Report
              </Title>
              <Content className='coverage-pdf-meta'>
                {filename ? `Manifest: ${filename}` : null}
                {filename && generatedAt ? ' · ' : null}
                {generatedAt ? `Generated: ${generatedAt}` : null}
              </Content>
            </div>
            <div className='coverage-pdf-match-section'>
              <Title headingLevel='h2' size='md'>
                Match analysis
              </Title>
              <div className='coverage-pdf-summary'>
                <MatchDonutChart
                  surface='pdf'
                  report={report}
                  width={PDF_DONUT_WIDTH}
                  height={PDF_DONUT_HEIGHT}
                />
                <div className='coverage-pdf-summary-detail'>
                  <div className='coverage-pdf-summary-text'>
                    <strong>
                      {getMatchedPackagePercentage(report)}% of packages match the Lightwell Network
                      catalog
                    </strong>
                    <br />
                    <span className='coverage-pdf-summary-subtext'>
                      Includes packages from every detected ecosystem, including ecosystems the
                      catalog does not support.
                    </span>
                  </div>
                  <div className='coverage-pdf-stats'>
                    {[
                      {
                        value: report.exact_matches,
                        label: 'Exact match',
                        color: 'exact' as const,
                      },
                      {
                        value: report.partial_matches,
                        label: 'Partial match',
                        color: 'partial' as const,
                      },
                      { value: report.unmatched, label: 'No match', color: 'none' as const },
                    ].map(({ value, label, color }) => (
                      <div key={label} className='coverage-pdf-stat'>
                        <div className='coverage-pdf-stat-value'>{value}</div>
                        <span
                          className='coverage-pdf-stat-bar'
                          style={{ backgroundColor: STAT_COLORS[color] }}
                        />
                        <div className='coverage-pdf-stat-label'>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className='coverage-pdf-ecosystem-section'>
              <Title headingLevel='h2' size='md'>
                Packages by ecosystem
              </Title>
              <Content component='p' className='coverage-pdf-ecosystem-subtitle'>
                <strong>{report.exact_matches + report.partial_matches}</strong> of{' '}
                <strong>{report.total}</strong> packages found in the Lightwell Network catalog.
              </Content>
              <div className='coverage-pdf-ecosystem-chart'>
                <EcosystemBarChart
                  surface='pdf'
                  showLegend={false}
                  report={report}
                  width={PDF_BAR_CHART_WIDTH}
                  height={getEcosystemBarChartHeight(report.ecosystem_coverage_summary.length)}
                />
              </div>
            </div>
          </div>
          <Title headingLevel='h2' size='md' style={{ pageBreakBefore: 'always' }}>
            Packages
          </Title>
        </>
      ) : null}
      <Table
        variant='compact'
        className='coverage-pdf-table'
        aria-label='Coverage report packages'
        gridBreakPoint=''
      >
        <Thead>
          <Tr>
            {PACKAGE_COLUMNS.map((column) => (
              <Th key={column} className={`coverage-pdf-col-${column.toLowerCase()}`}>
                {column}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {packages.map((pkg) => (
            <Tr key={`${pkg.ecosystem}-${pkg.name}-${pkg.version}`}>
              <Td dataLabel='Package' className='coverage-pdf-col-package'>
                {pkg.name}
              </Td>
              <Td dataLabel='Version' className='coverage-pdf-col-version'>
                {pkg.version || '—'}
              </Td>
              <Td dataLabel='Ecosystem' className='coverage-pdf-col-ecosystem'>
                {pkg.ecosystem}
              </Td>
              <Td dataLabel='Match' className='coverage-pdf-col-match'>
                <span
                  className='coverage-pdf-pill'
                  style={{ backgroundColor: PILL_COLORS[pkg.match_status] }}
                >
                  {MATCH_STATUS_LABEL[pkg.match_status]}
                </span>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
};

export default CoveragePdfTemplate;
