import {
  formatDistributionUrl,
  formatRepositoryName,
  getEcosystemFromContentType,
  getRepositoryDescription,
  getRepositoryNameFromPathSlug,
  getRepositoryPathSlug,
} from './helpers';

describe('getEcosystemFromContentType', () => {
  it('returns the ecosystem for a known content type', () => {
    expect(getEcosystemFromContentType('maven')).toBe('Java');
    expect(getEcosystemFromContentType('python')).toBe('Python');
  });

  it('normalizes content type casing', () => {
    expect(getEcosystemFromContentType('MAVEN')).toBe('Java');
  });

  it('returns undefined for missing or unknown content type', () => {
    expect(getEcosystemFromContentType()).toBeUndefined();
    expect(getEcosystemFromContentType('unknown')).toBeUndefined();
  });
});

describe('getRepositoryDescription', () => {
  it('returns a description for known content type and security level', () => {
    expect(getRepositoryDescription('maven', 'validated')).toBeDefined();
  });

  it('normalizes content type and security level casing', () => {
    expect(getRepositoryDescription('MAVEN', 'VALIDATED')).toEqual(
      getRepositoryDescription('maven', 'validated'),
    );
  });

  it('returns undefined when content type or security level is missing', () => {
    expect(getRepositoryDescription()).toBeUndefined();
    expect(getRepositoryDescription('maven')).toBeUndefined();
    expect(getRepositoryDescription(undefined, 'validated')).toBeUndefined();
  });

  it('returns a description for predisclosure security level', () => {
    expect(getRepositoryDescription('maven', 'predisclosure')).toBeDefined();
    expect(getRepositoryDescription('maven', 'predisclosure')).toBeTruthy();
  });
});

describe('formatRepositoryName', () => {
  it('formats ecosystem and security level when both are available', () => {
    expect(formatRepositoryName('maven', 'validated')).toBe('Java Validated');
    expect(formatRepositoryName('python', 'remediated')).toBe('Python Remediated');
  });

  it('falls back to repository name when content type or security level is missing', () => {
    expect(formatRepositoryName(undefined, 'validated', 'fallback-repo')).toBe('fallback-repo');
    expect(formatRepositoryName('maven', undefined, 'fallback-repo')).toBe('fallback-repo');
  });

  it('returns dash when no formatted name or fallback is available', () => {
    expect(formatRepositoryName()).toBe('—');
  });

  it('formats predisclosure repository name correctly', () => {
    expect(formatRepositoryName('maven', 'predisclosure')).toBe('Java Predisclosure');
  });
});

describe('getRepositoryPathSlug', () => {
  it('creates a slug from ecosystem and security level', () => {
    expect(getRepositoryPathSlug('maven', 'validated')).toBe('java-validated');
    expect(getRepositoryPathSlug('python', 'remediated')).toBe('python-remediated');
  });

  it('returns empty string when content type or security level is missing', () => {
    expect(getRepositoryPathSlug()).toBe('');
    expect(getRepositoryPathSlug('maven')).toBe('');
    expect(getRepositoryPathSlug(undefined, 'validated')).toBe('');
  });

  it('creates a slug for predisclosure security level', () => {
    expect(getRepositoryPathSlug('maven', 'predisclosure')).toBe('java-predisclosure');
  });
});

describe('getRepositoryNameFromPathSlug', () => {
  it('converts a slug into a Lightwell repository name', () => {
    expect(getRepositoryNameFromPathSlug('java-validated')).toBe('lightwell/java/validated');
    expect(getRepositoryNameFromPathSlug('python-remediated')).toBe('lightwell/python/remediated');
  });

  it('returns empty string for invalid slugs', () => {
    expect(getRepositoryNameFromPathSlug('')).toBe('');
    expect(getRepositoryNameFromPathSlug('java')).toBe('');
    expect(getRepositoryNameFromPathSlug('-validated')).toBe('');
    expect(getRepositoryNameFromPathSlug('java-')).toBe('');
  });

  it('converts predisclosure slug into repository name', () => {
    expect(getRepositoryNameFromPathSlug('java-predisclosure')).toBe(
      'lightwell/java/predisclosure',
    );
  });
});

describe('formatDistributionUrl', () => {
  it('transforms Pulp API URL to Lightwell URL for production', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/lightwell/java/validated',
      ),
    ).toBe('https://packages.redhat.com/lightwell/java/validated');
  });

  it('transforms Pulp API URL to Lightwell URL for stage', () => {
    expect(
      formatDistributionUrl(
        'https://packages.stage.redhat.com/api/pulp-content/lightwell/python/remediated/',
      ),
    ).toBe('https://packages.stage.redhat.com/lightwell/python/remediated/');
  });

  it('handles URLs without trailing slash', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/lightwell/python/validated',
      ),
    ).toBe('https://packages.redhat.com/lightwell/python/validated');
  });

  it('returns empty string unchanged', () => {
    expect(formatDistributionUrl('')).toBe('');
  });

  it('transforms demo Pulp API URL to Lightwell URL', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/public-lightwell-demo/python/validated/simple',
      ),
    ).toBe('https://packages.redhat.com/lightwell/public-lightwell-demo/python/validated/simple');
  });

  it('transforms demo Pulp API URL to Lightwell URL with trailing slash', () => {
    expect(
      formatDistributionUrl(
        'https://packages.redhat.com/api/pulp-content/public-lightwell-demo/python/validated/simple/',
      ),
    ).toBe('https://packages.redhat.com/lightwell/public-lightwell-demo/python/validated/simple/');
  });

  it('returns URL unchanged if it does not contain the expected path', () => {
    expect(formatDistributionUrl('https://example.com/some/other/path')).toBe(
      'https://example.com/some/other/path',
    );
  });
});
