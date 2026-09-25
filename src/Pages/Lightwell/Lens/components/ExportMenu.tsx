import type { PDFRequestPayload } from '@redhat-cloud-services/types';

import {
  getCoverageReportPackages,
  type CoverageReportPackage,
  type CoverageReportPackageFilters,
} from 'services/Lightwell/CoverageReportsApi';

import { buildCoveragePdfPayload } from '../pdf/coveragePdf';
import { fetchAllPages, resolvePdfItemCount } from '../../utils/exportUtils';
import { ExportMenu as ExportMenuBase } from '../../components/ExportMenu';

type ExportMenuProps = {
  uuid?: string;
  filename?: string;
  filters?: CoverageReportPackageFilters;
};

export function fetchAllCoveragePackages(
  uuid: string,
  filters?: CoverageReportPackageFilters,
): Promise<CoverageReportPackage[]> {
  return fetchAllPages((pageSize, pageIndex) =>
    getCoverageReportPackages(uuid, pageIndex + 1, pageSize, filters).then(({ data }) => data),
  );
}

export function ExportMenu({ uuid, filename, filters }: ExportMenuProps) {
  return (
    <ExportMenuBase
      isReady={Boolean(uuid)}
      ouiaId='lightwell-coverage-export-toggle'
      csvFilename={`lightwell-match-analysis-${uuid}.csv`}
      jsonFilename={`lightwell-match-analysis-${uuid}.json`}
      fetchRows={() => fetchAllCoveragePackages(uuid!, filters)}
      buildPdfRequest={async () => {
        const count = await resolvePdfItemCount(0, () =>
          getCoverageReportPackages(uuid!, 1, 1, filters).then(({ meta }) => meta.count),
        );
        return {
          filename: `lightwell-match-analysis-${uuid}.pdf`,
          payload: buildCoveragePdfPayload({
            uuid: uuid!,
            filename,
            filters,
            itemCount: count,
          }) as unknown as PDFRequestPayload,
        };
      }}
      errorNotification={{
        title: 'Error exporting report',
        message: 'Unable to export the match analysis report',
        id: 'coverage-export-error',
      }}
    />
  );
}
