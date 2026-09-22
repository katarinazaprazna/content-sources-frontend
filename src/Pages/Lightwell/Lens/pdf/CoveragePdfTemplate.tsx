import { Content, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { AsyncState } from '@redhat-cloud-services/types';

import type { CoverageMatchStatus } from 'services/Lightwell/CoverageReportsApi';
import { getMatchedPackagePercentage } from '../charts/matchDonutModel';
import type { CoveragePdfAdditionalData, CoveragePdfData } from './coveragePdf';

type CoveragePdfTemplateProps = {
  asyncData: AsyncState<CoveragePdfData>;
  additionalData?: Partial<CoveragePdfAdditionalData>;
};

const PACKAGE_COLUMNS = ['Package', 'Version', 'Ecosystem', 'Match'] as const;

const MATCH_STATUS_TEXT: Record<CoverageMatchStatus, string> = {
  exact: 'Exact',
  partial: 'Partial',
  none: 'None',
};

const CoveragePdfTemplate = ({ asyncData, additionalData }: CoveragePdfTemplateProps) => {
  const { data } = asyncData;
  const packages = data?.packages ?? [];
  const report = data?.report ?? null;
  const filename = additionalData?.filename;
  const generatedAt = additionalData?.generatedAt;
  const includeSummary = additionalData?.includeSummary !== false && !!report;
  const percentage = report ? getMatchedPackagePercentage(report) : 0;

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
        .coverage-pdf h1 { color: #c9190b; margin: 0 0 8px; }
        .coverage-pdf h2 { margin: 28px 0 12px; page-break-after: avoid; }
        .coverage-pdf .coverage-pdf-meta { color: #6a6e73; margin-bottom: 16px; }
        .coverage-pdf .coverage-pdf-stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin: 16px 0 28px;
        }
        .coverage-pdf .coverage-pdf-stat { text-align: center; }
        .coverage-pdf .coverage-pdf-stat-value { font-size: 24px; font-weight: 700; }
        .coverage-pdf .coverage-pdf-stat-value--matched { color: #3e8635; }
        .coverage-pdf .coverage-pdf-stat-label { font-size: 11px; color: #6a6e73; }
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
      `}</style>
      {includeSummary && report ? (
        <>
          <Title headingLevel='h1' size='xl'>
            Lightwell Match Analysis Report
          </Title>
          <Content className='coverage-pdf-meta'>
            {filename ? `Manifest: ${filename}` : null}
            {filename && generatedAt ? ' · ' : null}
            {generatedAt ? `Generated: ${generatedAt}` : null}
          </Content>
          <div className='coverage-pdf-stats'>
            <div className='coverage-pdf-stat'>
              <div className='coverage-pdf-stat-value coverage-pdf-stat-value--matched'>
                {percentage}%
              </div>
              <div className='coverage-pdf-stat-label'>Matched</div>
            </div>
            <div className='coverage-pdf-stat'>
              <div className='coverage-pdf-stat-value'>{report.total}</div>
              <div className='coverage-pdf-stat-label'>Total</div>
            </div>
            <div className='coverage-pdf-stat'>
              <div className='coverage-pdf-stat-value'>{report.exact_matches}</div>
              <div className='coverage-pdf-stat-label'>Exact match</div>
            </div>
            <div className='coverage-pdf-stat'>
              <div className='coverage-pdf-stat-value'>{report.partial_matches}</div>
              <div className='coverage-pdf-stat-label'>Partial match</div>
            </div>
            <div className='coverage-pdf-stat'>
              <div className='coverage-pdf-stat-value'>{report.unmatched}</div>
              <div className='coverage-pdf-stat-label'>No match</div>
            </div>
          </div>
          <Title headingLevel='h2' size='md'>
            Packages by ecosystem
          </Title>
          <Table
            variant='compact'
            className='coverage-pdf-table'
            aria-label='Coverage by ecosystem'
            gridBreakPoint=''
          >
            <Thead>
              <Tr>
                <Th>Ecosystem</Th>
                <Th>Total</Th>
                <Th>Exact match</Th>
                <Th>Partial match</Th>
                <Th>No match</Th>
              </Tr>
            </Thead>
            <Tbody>
              {report.ecosystem_coverage_summary.map((summary) => (
                <Tr key={summary.ecosystem}>
                  <Td dataLabel='Ecosystem'>{summary.ecosystem}</Td>
                  <Td dataLabel='Total'>{summary.total}</Td>
                  <Td dataLabel='Exact match'>{summary.exact_matches}</Td>
                  <Td dataLabel='Partial match'>{summary.partial_matches}</Td>
                  <Td dataLabel='No match'>{summary.unmatched}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Title headingLevel='h2' size='md'>
            Packages
          </Title>
        </>
      ) : (
        <Title headingLevel='h2' size='md'>
          Packages (continued)
        </Title>
      )}
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
                {MATCH_STATUS_TEXT[pkg.match_status]}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
};

export default CoveragePdfTemplate;
