/*
 * nav.ts — enhances the header navigation. The menu works without this script.
 * 1. Mobile menu (<details data-nav-menu>): closes on link click and on Escape.
 * 2. Sets aria-current="true" on the nav links of the section in view.
 */

const menu = document.querySelector<HTMLDetailsElement>('[data-nav-menu]');
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));

if (menu) {
  // A click on a link in the menu closes the menu.
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      menu.open = false;
    }
  });

  // Escape closes the menu and returns focus to its button.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
}

// Links that point to a section of the current page, grouped by section id.
const linksBySection = new Map<string, HTMLAnchorElement[]>();
for (const link of links) {
  const url = new URL(link.href);
  if (url.pathname !== location.pathname || url.hash.length < 2) continue;
  const id = decodeURIComponent(url.hash.slice(1));
  linksBySection.set(id, [...(linksBySection.get(id) ?? []), link]);
}

const sections = [...linksBySection.keys()]
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => el !== null);

if (sections.length > 0 && 'IntersectionObserver' in window) {
  const inView = new Set<string>();

  const update = (): void => {
    // The last section in page order that crosses the viewport center wins.
    const current = sections.filter((s) => inView.has(s.id)).pop()?.id;
    for (const [id, sectionLinks] of linksBySection) {
      for (const link of sectionLinks) {
        if (id === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
  };

  // The root margin shrinks the viewport to a line at its vertical center.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target.id);
        else inView.delete(entry.target.id);
      }
      update();
    },
    { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
  );

  for (const section of sections) observer.observe(section);
}
