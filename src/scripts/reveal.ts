// E1 scroll reveal. Adds `.is-visible` to `[data-reveal]` elements (see motion.css).
// The hidden state exists only under `html.js`. On any error this script removes
// `js` from <html>, so the content stays visible.

const root = document.documentElement;

try {
  // Tells the failsafe timer in BaseLayout that this script loaded.
  root.setAttribute('data-fx', '');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const show = (el: Element): void => el.classList.add('is-visible');
  const showAll = (): void => items.forEach(show);

  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    showAll();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // An element taller than the viewport cannot reach the 0.15 ratio:
          // reveal it as soon as it enters.
          if (
            entry.isIntersecting &&
            (entry.intersectionRatio >= 0.15 ||
              entry.boundingClientRect.height > window.innerHeight)
          ) {
            show(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: [0, 0.15], rootMargin: '0px 0px -8% 0px' },
    );

    // In or above the viewport at load (also after a #hash jump): reveal now.
    const viewportBottom = window.innerHeight;
    for (const el of items) {
      if (el.getBoundingClientRect().top < viewportBottom) show(el);
      else observer.observe(el);
    }

    // Keyboard focus never lands in hidden content.
    document.addEventListener('focusin', (event) => {
      const target = event.target;
      let el = target instanceof Element ? target.closest('[data-reveal]') : null;
      while (el) {
        show(el);
        observer.unobserve(el);
        el = el.parentElement ? el.parentElement.closest('[data-reveal]') : null;
      }
    });

    // Print shows all content.
    window.addEventListener('beforeprint', () => {
      showAll();
      observer.disconnect();
    });
  }
} catch {
  root.classList.remove('js');
}
