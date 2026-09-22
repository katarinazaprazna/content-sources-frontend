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
  type CoverageReportPackageFilters,
} from 'services/Lightwell/CoverageReportsApi';

import { buildCoveragePdfPayload } from '../pdf/coveragePdf';

type ExportMenuProps = {
  uuid?: string;
  filename?: string;
  filters?: CoverageReportPackageFilters;
};

async function resolveCoveragePdfItemCount(
  uuid: string,
  filters?: CoverageReportPackageFilters,
): Promise<number> {
  const { meta } = await getCoverageReportPackages(uuid, 1, 1, filters);
  return meta.count;
}

export function ExportMenu({ uuid, filename, filters }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  const { requestPdf } = useChrome();

  const handleExportPdf = async () => {
    if (!uuid || isExporting) {
      return;
    }

    setIsOpen(false);
    setIsExporting(true);
    try {
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
          key='pdf'
          isDisabled={isExporting}
          onClick={() => {
            void handleExportPdf();
          }}
        >
          Export as PDF
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
