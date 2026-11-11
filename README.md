# wojkr.github.io

## What this is

This is the portfolio site of Wojciech Krupa.
The live site is https://wojkr.github.io/.
The site is static. It has no server code.

## Stack

- [Astro](https://astro.build/) 7 (static output to `dist/`)
- TypeScript
- `@astrojs/sitemap` for the sitemap
- Manrope and Unbounded fonts (self-hosted through Fontsource)
- GitHub Actions and GitHub Pages for deployment

Node `>=22.23.4` is necessary. The deploy workflow uses Node 24.

## Local commands

| Command | Result |
| --- | --- |
| `npm install` | Installs the dependencies. |
| `npm run dev` | Starts the dev server with live reload. |
| `npm run build` | Builds the site into `dist/`. |
| `npm run preview` | Serves the built `dist/` folder locally. |
| `npm run check` | Runs `astro check` (types and Astro diagnostics). |

## Update content

All content is in data files. Do not put content in the layout files.

| To change | Edit this file |
| --- | --- |
| Name, headline, intro text, links, contact form endpoint | `src/content/site.json` |
| Jobs and work history | `src/content/experience.json` |
| Schools and courses | `src/content/education.json` |
| Skills and skill groups | `src/content/skills.json` |
| Projects (title, text, links, image) | `src/content/projects.json` |

### Add a project image

1. Put the image file in `src/assets/images/`.
2. Refer to the image from the project entry in `src/content/projects.json`. Use the same format as the other entries.
3. Run `npm run build`. Astro makes the optimized image sizes.
4. The card crops the image and keeps its top edge. To keep the middle of the image, add `"imagePosition": "center"` to the project entry.

## Animations

- All effects run only when `<html>` has `data-motion="on"`.
- The default follows the system setting "reduce motion". The **Animations** button in the header overrides it. The browser stores the choice in `localStorage` (key `motion`).
- With animations off, or without JavaScript, the site is static: no typing terminal, no scrolling technology row, no flying paper airplanes.
- Effect styles: `src/styles/motion.css`. State logic: `src/scripts/motion.ts`.

## Deploy

1. Push to `main`.
2. The workflow `.github/workflows/deploy.yml` builds the site and deploys it to GitHub Pages.

One-time setup: in the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

You can also start the workflow manually: **Actions → Deploy to GitHub Pages → Run workflow**.

## Rollback

Use one of these procedures:

- Revert the bad commit and push to `main`:
  ```sh
  git revert <commit>
  git push
  ```
- Or open **Actions**, select an older successful run of the workflow, and select **Re-run all jobs**.

The old site stays at https://wojkr.github.io/portfolio/. It comes from the `gh-pages` branch of the repository `wojkr/portfolio`.

## Contact form

The contact form sends its data to [Basin](https://usebasin.com/).
The Basin endpoint is in `src/content/site.json`.
The endpoint contains a public form ID. It is not a secret.
Do not put secrets or API keys in this repository.

## Requests on page load

When the page loads, it sends:

- One visit notification to the same Basin form.
- Wake-up requests to the demo servers. These servers are on free hosting and go to sleep when they are not in use.
