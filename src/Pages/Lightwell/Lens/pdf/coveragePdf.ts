import type { FetchData, PDFRequestPayload } from '@redhat-cloud-services/types';

import type {
  CompletedCoverageReport,
  CoverageReportPackage,
  CoverageReportPackageFilters,
  CoverageReportPackagesListResponse,
} from 'services/Lightwell/CoverageReportsApi';
import type { Meta } from 'services/Lightwell/types';

export const COVERAGE_PDF_MANIFEST = '/apps/content-sources/fed-mods.json';
export const COVERAGE_PDF_SCOPE = 'contentSources';
export const COVERAGE_PDF_MODULE = './CoveragePdfEntry';
export const COVERAGE_PDF_PAGE_SIZE = 50;
export const COVERAGE_REPORTS_PATH = '/api/content-sources/v1/coverage_reports/';

export function formatCoveragePdfGeneratedAt(date: Date = new Date()): string {
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export type CoveragePdfFetchParams = {
  uuid: string;
  limit?: number;
  offset?: number;
  filters?: CoverageReportPackageFilters;
  includeSummary?: boolean;
};

export type CoveragePdfAdditionalData = {
  filename?: string;
  generatedAt: string;
  includeSummary: boolean;
  headerBrand: 'lightwell';
};

export type CoveragePdfData = {
  packages: CoverageReportPackage[];
  meta: Meta;
  report: CompletedCoverageReport | null;
};

export function buildCoveragePackagesQueryParams(
  filters?: CoverageReportPackageFilters,
  pagination?: { limit: number; offset: number },
): Record<string, string> {
  const params: Record<string, string> = {
    limit: (pagination?.limit ?? COVERAGE_PDF_PAGE_SIZE).toString(),
    offset: (pagination?.offset ?? 0).toString(),
  };

  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.match_status?.length) {
    params.match_status = filters.match_status.join(',');
  }
  if (filters?.ecosystem?.length) {
    params.ecosystem = filters.ecosystem.join(',');
  }

  return params;
}

function isPackagesResponse(value: unknown): value is CoverageReportPackagesListResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as CoverageReportPackagesListResponse).data) &&
    typeof (value as CoverageReportPackagesListResponse).meta === 'object'
  );
}

function isCompletedReport(value: unknown): value is CompletedCoverageReport {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as CompletedCoverageReport).status === 'completed'
  );
}

export const fetchData = async (
  createAsyncRequest: Parameters<FetchData>[0],
  options?: CoveragePdfFetchParams,
): Promise<CoveragePdfData> => {
  const uuid = options?.uuid;
  if (!uuid) {
    throw new Error('Coverage report PDF export requires a report uuid');
  }

  const packagesResponse = await createAsyncRequest('content-sources-backend', {
    method: 'GET',
    url: `${COVERAGE_REPORTS_PATH}${encodeURIComponent(uuid)}/packages`,
    params: buildCoveragePackagesQueryParams(options?.filters, {
      limit: options?.limit ?? COVERAGE_PDF_PAGE_SIZE,
      offset: options?.offset ?? 0,
    }),
  });

  if (!isPackagesResponse(packagesResponse)) {
    throw new Error('Unexpected coverage report packages response');
  }

  // The per-page packages endpoint carries no coverage summary, so the report is
  // fetched separately and only for the first (cover) page that renders the summary.
  let report: CompletedCoverageReport | null = null;
  if (options?.includeSummary) {
    const reportResponse = await createAsyncRequest('content-sources-backend', {
      method: 'GET',
      url: `${COVERAGE_REPORTS_PATH}${encodeURIComponent(uuid)}`,
    });
    report = isCompletedReport(reportResponse) ? reportResponse : null;
  }

  return {
    packages: packagesResponse.data,
    meta: packagesResponse.meta,
    report,
  } satisfies CoveragePdfData;
};

export function buildCoveragePdfPayload({
  uuid,
  filename,
  filters,
  itemCount,
  generatedAt = formatCoveragePdfGeneratedAt(),
}: {
  uuid: string;
  filename?: string;
  filters?: CoverageReportPackageFilters;
  itemCount: number;
  generatedAt?: string;
}): PDFRequestPayload[] {
  const pageCount = Math.max(1, Math.ceil(Math.max(itemCount, 0) / COVERAGE_PDF_PAGE_SIZE));

  return Array.from({ length: pageCount }, (_, pageIndex) => ({
    manifestLocation: COVERAGE_PDF_MANIFEST,
    scope: COVERAGE_PDF_SCOPE,
    module: COVERAGE_PDF_MODULE,
    fetchDataParams: {
      uuid,
      limit: COVERAGE_PDF_PAGE_SIZE,
      offset: pageIndex * COVERAGE_PDF_PAGE_SIZE,
      filters,
      includeSummary: pageIndex === 0,
    },
    additionalData: {
      filename,
      generatedAt,
      includeSummary: pageIndex === 0,
      headerBrand: 'lightwell',
    } satisfies CoveragePdfAdditionalData,
  }));
}
