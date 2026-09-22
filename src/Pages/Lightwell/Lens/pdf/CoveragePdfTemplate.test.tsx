import React from 'react';
import { render, screen } from '@testing-library/react';

import CoveragePdfTemplate from './CoveragePdfTemplate';
import { defaultCoverageReportItem, defaultCoverageReportPackagesItem } from 'testingHelpers';

jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ChartAxis: ({ label }: { label?: string }) => (label ? <span>{label}</span> : null),
  ChartBar: () => null,
  ChartStack: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartDonut: ({ title, subTitle }: { title?: string; subTitle?: string }) => (
    <div>
      {title}
      {subTitle}
    </div>
  ),
  ChartLabel: () => null,
}));

describe('CoveragePdfTemplate', () => {
  it('renders the summary, charts, and package rows on the first page', () => {
    render(
      <CoveragePdfTemplate
        asyncData={{
          data: {
            packages: defaultCoverageReportPackagesItem,
            meta: { count: 3, limit: 50, offset: 0 },
            report: defaultCoverageReportItem,
          },
        }}
        additionalData={{
          filename: 'sbom.json',
          generatedAt: '25 Aug 2026',
          includeSummary: true,
        }}
      />,
    );

    expect(screen.getByText('Lightwell Match Analysis Report')).toBeInTheDocument();
    expect(screen.getByText(/Manifest: sbom.json/)).toBeInTheDocument();
    expect(screen.getByText(/Generated: 25 Aug 2026/)).toBeInTheDocument();

    expect(screen.getByText('Packages by ecosystem')).toBeInTheDocument();

    const packageRow = screen.getByText('spring-web').closest('tr');
    expect(packageRow).toHaveTextContent('6.1.5');
    expect(packageRow).toHaveTextContent('Exact');
  });

  it('omits the cover summary on continuation pages', () => {
    render(
      <CoveragePdfTemplate
        asyncData={{
          data: {
            packages: defaultCoverageReportPackagesItem.slice(0, 1),
            meta: { count: 3, limit: 50, offset: 50 },
            report: null,
          },
        }}
        additionalData={{ generatedAt: '25 Aug 2026', includeSummary: false }}
      />,
    );

    expect(screen.queryByText('Lightwell Match Analysis Report')).not.toBeInTheDocument();
    expect(screen.getByText('spring-web')).toBeInTheDocument();
  });
});
