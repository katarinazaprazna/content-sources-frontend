import {
  buildCoveragePackagesQueryParams,
  buildCoveragePdfPayload,
  fetchData,
  formatCoveragePdfGeneratedAt,
  COVERAGE_PDF_PAGE_SIZE,
} from './coveragePdf';
import { defaultCoverageReportItem } from 'testingHelpers';

const packagesCollection = {
  data: [
    {
      name: 'spring-web',
      version: '6.1.5',
      ecosystem: 'Java',
      covered: true,
      match_status: 'exact',
    },
  ],
  links: { first: '', last: '' },
  meta: { count: 1, limit: 50, offset: 0 },
};

describe('buildCoveragePackagesQueryParams', () => {
  it('serializes pagination and active filters', () => {
    expect(
      buildCoveragePackagesQueryParams(
        { search: 'log4j', match_status: ['exact', 'partial'], ecosystem: ['Java'] },
        { limit: 50, offset: 100 },
      ),
    ).toEqual({
      limit: '50',
      offset: '100',
      search: 'log4j',
      match_status: 'exact,partial',
      ecosystem: 'Java',
    });
  });

  it('omits empty filters', () => {
    expect(buildCoveragePackagesQueryParams(undefined, { limit: 50, offset: 0 })).toEqual({
      limit: '50',
      offset: '0',
    });
  });
});

describe('fetchData', () => {
  it('requests packages with pagination and filters, and the report only for the summary page', async () => {
    const createAsyncRequest = jest
      .fn()
      .mockResolvedValueOnce(packagesCollection)
      .mockResolvedValueOnce(defaultCoverageReportItem);

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      limit: 50,
      offset: 50,
      filters: { match_status: ['exact'] },
      includeSummary: true,
    });

    expect(createAsyncRequest).toHaveBeenNthCalledWith(1, 'content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/coverage_reports/report-uuid/packages',
      params: { limit: '50', offset: '50', match_status: 'exact' },
    });
    expect(createAsyncRequest).toHaveBeenNthCalledWith(2, 'content-sources-backend', {
      method: 'GET',
      url: '/api/content-sources/v1/coverage_reports/report-uuid',
    });
    expect(result.packages[0].name).toBe('spring-web');
    expect(result.meta.count).toBe(1);
    expect(result.report).toEqual(defaultCoverageReportItem);
  });

  it('skips the report request on continuation pages', async () => {
    const createAsyncRequest = jest.fn().mockResolvedValue(packagesCollection);

    const result = await fetchData(createAsyncRequest, {
      uuid: 'report-uuid',
      offset: 50,
      includeSummary: false,
    });

    expect(createAsyncRequest).toHaveBeenCalledTimes(1);
    expect(result.report).toBeNull();
  });

  it('requires a uuid', async () => {
    await expect(fetchData(jest.fn())).rejects.toThrow('uuid');
  });
});

describe('buildCoveragePdfPayload', () => {
  it('splits large reports into paginated tasks', () => {
    const itemCount = COVERAGE_PDF_PAGE_SIZE + 100;
    const payload = buildCoveragePdfPayload({
      uuid: 'report-uuid',
      filename: 'sbom.json',
      itemCount,
      generatedAt: '25 Aug 2026',
    });

    expect(payload).toHaveLength(Math.ceil(itemCount / COVERAGE_PDF_PAGE_SIZE));
    expect(payload[0]).toMatchObject({
      manifestLocation: '/apps/content-sources/fed-mods.json',
      scope: 'contentSources',
      module: './CoveragePdfEntry',
      fetchDataParams: {
        uuid: 'report-uuid',
        limit: COVERAGE_PDF_PAGE_SIZE,
        offset: 0,
        includeSummary: true,
      },
      additionalData: {
        filename: 'sbom.json',
        generatedAt: '25 Aug 2026',
        includeSummary: true,
        headerBrand: 'lightwell',
      },
    });
    expect(payload[1].fetchDataParams).toMatchObject({
      offset: COVERAGE_PDF_PAGE_SIZE,
      includeSummary: false,
    });
    expect(payload[1].additionalData).toMatchObject({ includeSummary: false });
  });

  it('emits a single task when the filtered set is empty', () => {
    const payload = buildCoveragePdfPayload({ uuid: 'report-uuid', itemCount: 0 });

    expect(payload).toHaveLength(1);
    expect(payload[0].fetchDataParams).toMatchObject({ offset: 0, limit: COVERAGE_PDF_PAGE_SIZE });
  });

  it('defaults the generated date to a UTC display date', () => {
    expect(formatCoveragePdfGeneratedAt(new Date('2026-08-25T22:58:00Z'))).toBe('25 Aug 2026');

    const payload = buildCoveragePdfPayload({ uuid: 'report-uuid', itemCount: 1 });
    expect(payload[0].additionalData).toEqual(
      expect.objectContaining({ generatedAt: formatCoveragePdfGeneratedAt() }),
    );
  });
});
