import { Button, Flex, Label, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import CopyLabel from './CopyLabel';

type PackageRemediationsTabProps = {
  version: string;
};

type PackageIdentity = {
  name: string;
  group?: string;
  isPython?: boolean;
};

type CveSeverity = 'Critical' | 'Important' | 'Moderate' | 'Low';

type Cve = {
  id: string;
  severity: CveSeverity;
  remediationStatus?: 'Fixed';
};

type Remediation = {
  cveId: string;
  version: string;
  release: string;
  isLatest: boolean;
};

const formatReleaseCopyText = (
  { name, group = '', isPython = false }: PackageIdentity,
  version: string,
) => (isPython ? `pip install ${name}==${version}` : `${group}:${name}:${version}`);

const toLightwellVersion = (release: Pick<Remediation, 'version' | 'release'>) =>
  `${release.version}.${release.release}`;

const PACKAGE_IDENTITY: PackageIdentity = {
  name: 'woodstox-core',
  group: 'com.fasterxml.woodstox',
};

const SEVERITY_COLORS: Record<CveSeverity, 'red' | 'orange' | 'yellow' | 'blue'> = {
  Critical: 'red',
  Important: 'orange',
  Moderate: 'yellow',
  Low: 'blue',
};

const CVES: Cve[] = [
  { id: 'CVE-2022-40152', severity: 'Critical', remediationStatus: 'Fixed' },
  { id: 'CVE-2022-40151', severity: 'Important', remediationStatus: 'Fixed' },
  { id: 'CVE-2023-34454', severity: 'Moderate' },
  { id: 'CVE-2024-23944', severity: 'Low' },
];

const CVE_BY_ID = Object.fromEntries(CVES.map((cve) => [cve.id, cve]));

const getDummyRemediations = (version: string): Remediation[] => [
  { cveId: 'CVE-2022-40152', version, release: 'rhlw-00003', isLatest: true },
  { cveId: 'CVE-2022-40151', version, release: 'rhlw-00003', isLatest: true },
  { cveId: 'CVE-2022-40152', version, release: 'rhlw-00002', isLatest: false },
  { cveId: 'CVE-2022-40151', version, release: 'rhlw-00002', isLatest: false },
  { cveId: 'CVE-2023-34454', version, release: 'rhlw-00002', isLatest: false },
  { cveId: 'CVE-2024-23944', version, release: 'rhlw-00002', isLatest: false },
  { cveId: 'CVE-2022-40152', version, release: 'rhlw-00001', isLatest: false },
  { cveId: 'CVE-2022-40151', version, release: 'rhlw-00001', isLatest: false },
];

const PackageRemediationsTab = ({ version }: PackageRemediationsTabProps) => {
  const remediations = getDummyRemediations(version);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <Title headingLevel='h2' size='xl'>
        Remediations for: {PACKAGE_IDENTITY.name} {version}
      </Title>
      <Table aria-label={`Remediations for: ${PACKAGE_IDENTITY.name} ${version}`} isStriped>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th width={30} className='pf-v6-u-text-align-end'>
              Available in
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {remediations.map((build) => {
            const cve = CVE_BY_ID[build.cveId];
            const fullVersion = toLightwellVersion(build);

            if (!cve) {
              return null;
            }

            return (
              <Tr key={`${build.cveId}-${fullVersion}`}>
                <Td dataLabel='Name'>
                  <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <Button
                      variant='link'
                      isInline
                      component='a'
                      href={`https://access.redhat.com/security/cve/${cve.id}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {cve.id}
                    </Button>
                    <Label isCompact variant='outline' color={SEVERITY_COLORS[cve.severity]}>
                      {cve.severity}
                    </Label>
                    {cve.remediationStatus === 'Fixed' ? (
                      <Label isCompact variant='outline' color='green'>
                        Fixed
                      </Label>
                    ) : null}
                  </Flex>
                </Td>
                <Td dataLabel='Available in'>
                  <Flex
                    gap={{ default: 'gapSm' }}
                    alignItems={{ default: 'alignItemsCenter' }}
                    justifyContent={{ default: 'justifyContentFlexEnd' }}
                  >
                    {build.isLatest ? (
                      <Label isCompact color='blue'>
                        Latest
                      </Label>
                    ) : null}
                    <CopyLabel copyText={formatReleaseCopyText(PACKAGE_IDENTITY, fullVersion)}>
                      {fullVersion}
                    </CopyLabel>
                  </Flex>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Flex>
  );
};

export default PackageRemediationsTab;
