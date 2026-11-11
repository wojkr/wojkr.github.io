/*
 * Visit notification: one POST to Basin for each page load, on the production host only.
 * The payload keys and value formats are a contract with the site owner (Basin classification).
 * Do not rename `isMoblie`.
 */

const PING_DELAY_MS = 1000;

type UserAgentData = { platform?: string; mobile?: boolean };

function isProductionHost(): boolean {
  try {
    return location.hostname === new URL(import.meta.env.SITE ?? '').hostname;
  } catch {
    return false;
  }
}

function basinUrl(): string | null {
  const section = document.querySelector<HTMLElement>('[data-basin-url]');
  if (section?.dataset.basinUrl) return section.dataset.basinUrl;
  return document.querySelector<HTMLFormElement>('form[data-contact-form]')?.action ?? null;
}

function sendPing(url: string): void {
  const uaData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  const now = new Date();
  const payload = {
    email: 'test@test.com',
    platform: uaData?.platform || 'no data',
    isMoblie: uaData?.mobile ? 'Mobile' : 'Desktop',
    date: now.toDateString(),
    time: now.toTimeString(),
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Ignore errors: the ping must not affect the page.
  });
}

function schedulePing(): void {
  const url = basinUrl();
  if (!url) return;
  const start = (): void => {
    window.setTimeout(() => sendPing(url), PING_DELAY_MS);
  };
  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
  }
}

if (isProductionHost()) schedulePing();
