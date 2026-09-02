import { PageSection, Stack, StackItem } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import LightwellPageHeader from '../components/LightwellPageHeader';
import { useManifestUpload } from './hooks/useManifestUpload';
import ManifestUploadCard from './components/ManifestUploadCard';

const ManifestUpload = () => {
  const { uploadProps } = useManifestUpload();

  return (
    <>
      <LightwellPageHeader
        title='Lightwell Lens'
        ouiaId='lightwell-coverage-header'
        description='Upload your SBOM or package manifest to assess your stack against the Lightwell Network catalog.'
      />
      {/* plXs matches the mXs margin LightwellPageHeader applies to its inner title flex, keeping content left-aligned */}
      <PageSection
        aria-label='Lens Uploader'
        hasBodyWrapper={false}
        className={`${spacing.pt_0} ${spacing.pbLg} ${spacing.pxLg} ${spacing.plXs}`}
      >
        <Stack hasGutter style={{ maxWidth: 1200 }}>
          <StackItem>
            <ManifestUploadCard {...uploadProps} />
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default ManifestUpload;
