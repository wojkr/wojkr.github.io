/*
 * motion.ts — the one motion state of the site.
 *
 * State: <html data-motion="on" | "off">. An inline script in BaseLayout sets it
 * before the first paint: the stored choice (`localStorage` key `motion`) wins;
 * if there is none, the system setting decides. All effect CSS runs only under
 * `html[data-motion='on']` (see motion.css).
 *
 * API:
 *   motionOn()            — true when motion is on.
 *   setMotion(on)         — the visitor's choice: sets the state and stores it.
 *   onMotionChange(cb)    — calls `cb(on)` after each change.
 *   Event: `motionchange` on `document`, `detail: { on: boolean }`.
 *
 * While no choice is stored, the state follows live changes of the system setting.
 */

const KEY = 'motion';
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

const readChoice = (): boolean => {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'on' || value === 'off';
  } catch {
    return false;
  }
};

/** True after the visitor made a choice (also when storage is not available). */
let chosen = readChoice();

const apply = (on: boolean): void => {
  root.setAttribute('data-motion', on ? 'on' : 'off');
  document.dispatchEvent(new CustomEvent('motionchange', { detail: { on } }));
};

export const motionOn = (): boolean => root.getAttribute('data-motion') === 'on';

export const setMotion = (on: boolean): void => {
  chosen = true;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Storage is not available: the choice applies to this page view only.
  }
  apply(on);
};

export const onMotionChange = (cb: (on: boolean) => void): void => {
  document.addEventListener('motionchange', () => cb(motionOn()));
};

// Follow the system setting only while there is no stored choice.
reduce.addEventListener('change', () => {
  if (!chosen && !readChoice()) apply(!reduce.matches);
});
