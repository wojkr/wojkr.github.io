/*
 * Terminal typewriter (effect E2). Enhances `Terminal.astro`.
 *
 * Markup contract:
 *   [data-terminal][data-messages='[{"title":"…","lines":["…"]}]']
 *     [data-terminal-title]  — receives the typed title
 *     [data-terminal-line]   — receives the typed line
 *
 * The CSS of the component shows the animated line only under
 * `html.js[data-motion='on']`. This script only drives the text.
 * The loop stops when the terminal is off screen, when the tab is hidden,
 * and when motion is off (the CSS then shows the static list). It starts
 * again when motion goes on.
 */

import { motionOn, onMotionChange } from './motion.ts';

interface TerminalMessage {
  title: string;
  lines: string[];
}

interface TerminalEntry {
  title: string;
  line: string;
}

/** Delay between two typed characters. */
const TYPE_MS = 55;
/** Delay between two deleted characters. */
const DELETE_MS = 28;
/** Time a complete line stays on screen. */
const HOLD_MS = 1800;
/** Pause before the next line starts. */
const GAP_MS = 350;

function isMessage(value: unknown): value is TerminalMessage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<TerminalMessage>;
  return (
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every((line) => typeof line === 'string')
  );
}

function readEntries(raw: string | undefined): TerminalEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isMessage)
      .flatMap((message) => message.lines.map((line) => ({ title: message.title, line })));
  } catch {
    return [];
  }
}

function initTerminal(root: HTMLElement): void {
  const titleEl = root.querySelector<HTMLElement>('[data-terminal-title]');
  const lineEl = root.querySelector<HTMLElement>('[data-terminal-line]');
  const entries = readEntries(root.dataset.messages);
  if (!titleEl || !lineEl || entries.length === 0) return;

  let index = 0; // current entry
  let count = 0; // number of visible characters of the current text
  let deleting = false;
  let onScreen = !('IntersectionObserver' in window);
  let timer: number | undefined;

  const textOf = (entry: TerminalEntry): string => `${entry.title} ${entry.line}`;

  const render = (entry: TerminalEntry): void => {
    const visible = textOf(entry).slice(0, count);
    titleEl.textContent = visible.slice(0, entry.title.length);
    lineEl.textContent = visible.slice(entry.title.length);
  };

  const step = (): void => {
    timer = undefined;
    const entry = entries[index];
    if (!entry) return;
    const text = textOf(entry);
    let delay = TYPE_MS;

    if (!deleting) {
      count = Math.min(count + 1, text.length);
      render(entry);
      if (count === text.length) {
        deleting = true;
        delay = HOLD_MS;
      }
    } else {
      const nextIndex = (index + 1) % entries.length;
      const next = entries[nextIndex];
      // The title stays on screen when the next line has the same title.
      const keep = next && next.title === entry.title ? entry.title.length + 1 : 0;
      if (count > keep) {
        count -= 1;
        render(entry);
        delay = DELETE_MS;
      }
      if (count <= keep) {
        index = nextIndex;
        deleting = false;
        delay = GAP_MS;
      }
    }

    timer = window.setTimeout(step, delay);
  };

  /** Starts or stops the one timer chain. */
  const sync = (): void => {
    const shouldRun = onScreen && !document.hidden && motionOn();
    if (shouldRun && timer === undefined) {
      timer = window.setTimeout(step, GAP_MS);
    } else if (!shouldRun && timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((records) => {
      for (const record of records) onScreen = record.isIntersecting;
      sync();
    });
    observer.observe(root);
  }

  document.addEventListener('visibilitychange', sync);
  onMotionChange(sync);
  sync();
}

// The component CSS shows the animated line only under `html.js`.
if (document.documentElement.classList.contains('js')) {
  document.querySelectorAll<HTMLElement>('[data-terminal]').forEach((root) => initTerminal(root));
}
