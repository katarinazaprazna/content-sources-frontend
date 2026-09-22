import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertVariant } from '@patternfly/react-core';

import { ExportMenu } from './ExportMenu';
import { getCoverageReportPackages } from 'services/Lightwell/CoverageReportsApi';

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: jest.fn(),
}));

jest.mock('services/Lightwell/CoverageReportsApi', () => {
  const actual = jest.requireActual('services/Lightwell/CoverageReportsApi');
  return {
    ...actual,
    getCoverageReportPackages: jest.fn(),
  };
});

jest.mock('Hooks/useErrorNotification', () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock('Hooks/useNotification', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import useNotification from 'Hooks/useNotification';

const requestPdf = jest.fn().mockResolvedValue(undefined);
const notify = jest.fn();

beforeEach(() => {
  (useChrome as jest.Mock).mockReturnValue({ requestPdf });
  (useNotification as jest.Mock).mockReturnValue({ notify });
  requestPdf.mockReset();
  requestPdf.mockResolvedValue(undefined);
  notify.mockClear();
  (getCoverageReportPackages as jest.Mock).mockReset();
  (getCoverageReportPackages as jest.Mock).mockResolvedValue({
    data: [],
    links: { first: '', last: '' },
    meta: { count: 120, limit: 1, offset: 0 },
  });
});

describe('ExportMenu PDF', () => {
  it('requests a split PDF from the coverage PDF module using the active filters', async () => {
    const user = userEvent.setup();
    render(
      <ExportMenu uuid='report-uuid' filename='sbom.json' filters={{ match_status: ['exact'] }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(screen.getByRole('menuitem', { name: 'Export as PDF' }));

    await waitFor(() => {
      expect(requestPdf).toHaveBeenCalledTimes(1);
    });
    expect(getCoverageReportPackages).toHaveBeenCalledWith('report-uuid', 1, 1, {
      match_status: ['exact'],
    });

    const pdfRequest = requestPdf.mock.calls[0][0];
    expect(pdfRequest.filename).toBe('lightwell-match-analysis-report-uuid.pdf');
    expect(pdfRequest.payload).toHaveLength(3);
    expect(pdfRequest.payload[0]).toMatchObject({
      module: './CoveragePdfEntry',
      fetchDataParams: {
        uuid: 'report-uuid',
        limit: 50,
        offset: 0,
        includeSummary: true,
        filters: { match_status: ['exact'] },
      },
      additionalData: { includeSummary: true, filename: 'sbom.json', headerBrand: 'lightwell' },
    });
    expect(pdfRequest.payload[1].fetchDataParams.offset).toBe(50);
    expect(pdfRequest.payload[2].fetchDataParams.offset).toBe(100);
  });

  it('closes the menu and shows generating feedback while the PDF is in progress', async () => {
    let resolvePdf: () => void = () => undefined;
    requestPdf.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePdf = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<ExportMenu uuid='report-uuid' filename='sbom.json' />);

    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(screen.getByRole('menuitem', { name: 'Export as PDF' }));

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Export as PDF' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Exporting' })).toBeDisabled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: AlertVariant.info,
        title: 'Generating PDF',
      }),
    );

    resolvePdf();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export' })).toBeEnabled();
    });
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: AlertVariant.success,
        title: 'PDF ready',
      }),
    );
  });

  it('disables the toggle when no report uuid is available', () => {
    render(<ExportMenu />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });
});
