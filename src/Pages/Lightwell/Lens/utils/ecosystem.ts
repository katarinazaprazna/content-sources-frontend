export type EcosystemInfo = {
  name: string;
  supported: boolean;
};

export const formatEcosystemName = (name: string, supported: boolean): string =>
  supported ? name : `${name} (unsupported)`;
