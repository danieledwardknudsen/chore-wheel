import type { BrowserContext, Page } from '@playwright/test';

// Installs a virtual WebAuthn authenticator via the Chrome DevTools Protocol so
// passkey registration/authentication run end-to-end with real challenges.
// Chromium-only (the suite runs only chromium).
export const installVirtualAuthenticator = async (context: BrowserContext, page: Page) => {
  const client = await context.newCDPSession(page);
  await client.send('WebAuthn.enable');
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
};
