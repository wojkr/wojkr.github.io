// E3 cursor spotlight. Sets `--mx` / `--my` (px, relative to the card) on the
// `.spotlight` element below the pointer (see motion.css). One delegated
// listener, one style write per frame.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const noHover = window.matchMedia('(hover: none)');

let card: HTMLElement | null = null;
let pointerX = 0;
let pointerY = 0;
let frame = 0;

const write = (): void => {
  frame = 0;
  if (!card) return;
  const rect = card.getBoundingClientRect();
  // The glow layer starts at the padding box: subtract the border width.
  card.style.setProperty('--mx', `${pointerX - rect.left - card.clientLeft}px`);
  card.style.setProperty('--my', `${pointerY - rect.top - card.clientTop}px`);
};

document.addEventListener(
  'pointermove',
  (event) => {
    if (event.pointerType === 'touch' || noHover.matches || reducedMotion.matches) return;
    const target = event.target;
    card = target instanceof Element ? target.closest<HTMLElement>('.spotlight') : null;
    if (!card) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(write);
  },
  { passive: true },
);
