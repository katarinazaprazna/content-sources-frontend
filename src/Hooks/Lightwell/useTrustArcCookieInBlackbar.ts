import { useLayoutEffect } from 'react';

/** Move TrustArc's cookie link into Chrome's #consent_blackbar. */
export const useTrustArcCookieInBlackbar = () => {
  useLayoutEffect(() => {
    const blackbar = document.getElementById('consent_blackbar') as HTMLElement;
    const cookie = document.getElementById('teconsent');
    if (blackbar && cookie) {
      blackbar.appendChild(cookie);
    }
  }, []);
};
