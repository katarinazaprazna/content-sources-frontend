import { useState } from 'react';
import {
  AlertVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Spinner,
  type MenuToggleElement,
} from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import type { PDFRequestPayload } from '@redhat-cloud-services/types';

import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';
import {
  getCoverageReportPackages,
  type CoverageReportPackage,
  type CoverageReportPackageFilters,
} from 'services/Lightwell/CoverageReportsApi';

import { buildCoveragePdfPayload } from '../pdf/coveragePdf';
import { exportToCsv, exportToJson } from '../../utils/exportUtils';

type ExportMenuProps = {
  uuid?: string;
  filename?: string;
  filters?: CoverageReportPackageFilters;
};

type ExportFormat = 'csv' | 'pdf' | 'json';

const EXPORT_PAGE_SIZE = 200;

async function resolveCoveragePdfItemCount(
  uuid: string,
  filters?: CoverageReportPackageFilters,
): Promise<number> {
  const { meta } = await getCoverageReportPackages(uuid, 1, 1, filters);
  return meta.count;
}

export async function fetchAllCoveragePackages(
  uuid: string,
  filters?: CoverageReportPackageFilters,
): Promise<CoverageReportPackage[]> {
  const packages: CoverageReportPackage[] = [];
  let page = 1;

  while (true) {
    const { data } = await getCoverageReportPackages(uuid, page, EXPORT_PAGE_SIZE, filters);

    packages.push(...data);

    if (data.length < EXPORT_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return packages;
}

export function ExportMenu({ uuid, filename, filters }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  const { requestPdf } = useChrome();

  const handleExport = async (format: ExportFormat) => {
    if (!uuid || isExporting) {
      return;
    }

    setIsOpen(false);
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        notify({
          variant: AlertVariant.info,
          title: 'Generating PDF',
          description: 'Your PDF is being generated. The download will start when it is ready.',
        });
        const count = await resolveCoveragePdfItemCount(uuid, filters);
        await requestPdf({
          filename: `lightwell-match-analysis-${uuid}.pdf`,
          payload: buildCoveragePdfPayload({
            uuid,
            filename,
            filters,
            itemCount: count,
          }) as unknown as PDFRequestPayload,
        });
        notify({
          variant: AlertVariant.success,
          title: 'PDF ready',
          description: 'Your download should start shortly.',
        });
        return;
      }

      const packages = await fetchAllCoveragePackages(uuid, filters);
      if (format === 'csv') {
        exportToCsv(packages, `lightwell-vulnerabilities.csv`);
      } else {
        exportToJson(packages, `lightwell-vulnerabilities.json`);
      }
    } catch (err) {
      errorNotifier(
        'Error exporting report',
        'Unable to export the match analysis report',
        err,
        'coverage-export-error',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isExporting) {
          setIsOpen(open);
        }
      }}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          isDisabled={!uuid || isExporting}
          variant='secondary'
          ouiaId='lightwell-coverage-export-toggle'
          aria-busy={isExporting}
          icon={isExporting ? <Spinner size='sm' aria-hidden='true' /> : undefined}
        >
          {isExporting ? 'Exporting' : 'Export'}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem
          key='csv'
          isDisabled={isExporting}
          onClick={() => {
            void handleExport('csv');
          }}
        >
          Export as CSV
        </DropdownItem>
        <DropdownItem
          key='json'
          isDisabled={isExporting}
          onClick={() => {
            void handleExport('json');
          }}
        >
          Export as JSON
        </DropdownItem>
        <DropdownItem
          key='pdf'
          isDisabled={isExporting}
          onClick={() => {
            void handleExport('pdf');
          }}
        >
          Export as PDF
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
