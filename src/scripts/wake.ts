/*
 * wake.ts — wakes the sleeping demo servers (free hosting) of the projects.
 *
 * Input: the element with `data-wake-urls` (a JSON array of URLs, built in Projects.astro).
 * Runs only on the production host. Sends one request per URL after the page load,
 * when the browser is idle. Ignores all errors. Logs nothing.
 */

function readWakeUrls(): string[] {
  const raw = document.querySelector<HTMLElement>('[data-wake-urls]')?.dataset.wakeUrls;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((url): url is string => typeof url === 'string' && url.startsWith('https://'));
  } catch {
    return [];
  }
}

function wakeServers(): void {
  for (const url of readWakeUrls()) {
    try {
      // Opaque response; only the request matters.
      fetch(url, { mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => {});
    } catch {
      // Ignore: a failed wake-up must not affect the page.
    }
  }
}

function scheduleWake(): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(wakeServers);
  } else {
    window.setTimeout(wakeServers, 1000);
  }
}

function isProductionHost(): boolean {
  try {
    return location.hostname === new URL(import.meta.env.SITE ?? '').hostname;
  } catch {
    return false;
  }
}

if (isProductionHost()) {
  if (document.readyState === 'complete') {
    scheduleWake();
  } else {
    window.addEventListener('load', scheduleWake, { once: true });
  }
}
