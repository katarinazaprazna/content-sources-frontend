import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import type { ManifestUploadCardProps } from './Coverage/components/ManifestUploadCard';

export const MOCK_REPORT: CompletedCoverageReport = {
  uuid: 'mock-report',
  status: 'completed',
  created_at: '2026-08-18T00:00:00Z',
  completed_at: '2026-08-18T00:00:01Z',
  total: 1920,
  exact_matches: 1265,
  partial_matches: 345,
  unmatched: 310,
  ecosystem_coverage_summary: [
    { ecosystem: 'Java', total: 650, exact_matches: 450, partial_matches: 110, unmatched: 90 },
    { ecosystem: 'npm', total: 550, exact_matches: 380, partial_matches: 90, unmatched: 80 },
    { ecosystem: 'Python', total: 400, exact_matches: 270, partial_matches: 70, unmatched: 60 },
    { ecosystem: 'Go', total: 150, exact_matches: 100, partial_matches: 20, unmatched: 30 },
    { ecosystem: 'Rust', total: 50, exact_matches: 30, partial_matches: 20, unmatched: 0 },
    { ecosystem: 'PHP', total: 120, exact_matches: 35, partial_matches: 35, unmatched: 50 },
  ],
};

const mockUploadProps: ManifestUploadCardProps = {
  file: undefined,
  fileError: undefined,
  processError: undefined,
  step: 'select',
  reportUUID: '',
  onDropAccepted: () => undefined,
  onRetry: () => undefined,
};

export const MOCK_UPLOAD = {
  uploadProps: mockUploadProps,
};

export const MOCK_REPORT_VIEW = {
  filename: 'Vuln-Report_2026-08-18.csv',
  report: MOCK_REPORT,
  isLoading: false,
  isError: false,
  error: null,
  startOver: () => undefined,
};
