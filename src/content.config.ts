/*
 * Content model. All site content is in `src/content/*.json`.
 * To update career, skills, or projects: edit the JSON only. The build fails if the data is invalid.
 *
 * How to query (in the frontmatter of an .astro file):
 *
 *   import { getCollection, getEntry } from 'astro:content';
 *
 *   // site — one entry, id "site". `site.profileImage` is ImageMetadata for <Image />.
 *   const site = (await getEntry('site', 'site'))!.data;
 *
 *   // experience — sort by `order`; `group` is "main" or "earlier"; `end: null` = present.
 *   const experience = (await getCollection('experience'))
 *     .map((e) => e.data)
 *     .sort((a, b) => a.order - b.order);
 *   const main = experience.filter((e) => e.group === 'main');
 *
 *   // education — sort by `order`.
 *   const education = (await getCollection('education'))
 *     .map((e) => e.data)
 *     .sort((a, b) => a.order - b.order);
 *
 *   // skills — one entry per group; sort by `order`. `items` keeps the JSON order.
 *   const skills = (await getCollection('skills'))
 *     .map((e) => e.data)
 *     .sort((a, b) => a.order - b.order);
 *
 *   // projects — sort by `order`. `image` is ImageMetadata:
 *   //   <Image src={project.image} alt={project.imageAlt} />   (import { Image } from 'astro:assets')
 *   const projects = (await getCollection('projects'))
 *     .map((e) => e.data)
 *     .sort((a, b) => a.order - b.order);
 *
 * Notes:
 * - `getCollection()` does not guarantee order. Always sort by `order`.
 * - Image paths in JSON are relative to the JSON file, e.g. "../assets/images/profile.webp".
 * - Each array item needs a unique `id`. Unknown keys are errors (they catch typos).
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const httpsUrl = z.url({ protocol: /^https$/ });
const order = z.number().int().nonnegative();
/** Year and month, e.g. "2025-04". */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use the format YYYY-MM');

const site = defineCollection({
  // site.json is one plain object. The parser wraps it as the single entry "site".
  loader: file('src/content/site.json', {
    parser: (raw) => [{ id: 'site', ...JSON.parse(raw) }],
  }),
  schema: ({ image }) =>
    z.strictObject({
      id: z.literal('site'),
      name: text,
      headline: text,
      summary: text,
      about: text,
      location: text.optional(),
      profileImage: image(),
      profileImageAlt: text,
      links: z.strictObject({
        linkedin: httpsUrl,
        github: httpsUrl,
        projects: httpsUrl,
      }),
      projectsShowcaseUrl: httpsUrl,
      contact: z.strictObject({
        basinUrl: httpsUrl,
      }),
      terminal: z.strictObject({
        prompt: text,
        messages: z
          .array(
            z.strictObject({
              title: text,
              lines: z.array(text).min(1),
            }),
          )
          .min(1),
      }),
      marquee: z.array(text).min(1),
    }),
});

const experience = defineCollection({
  loader: file('src/content/experience.json'),
  schema: z
    .strictObject({
      id: text,
      order,
      group: z.enum(['main', 'earlier']),
      role: text,
      company: text,
      start: yearMonth,
      /** null = present */
      end: yearMonth.nullable(),
      bullets: z.array(text).min(1),
      tags: z.array(text).min(1).optional(),
    })
    .refine((e) => e.end === null || e.end >= e.start, {
      message: '`end` must not be before `start`',
      path: ['end'],
    }),
});

const education = defineCollection({
  loader: file('src/content/education.json'),
  schema: z.strictObject({
    id: text,
    order,
    degree: text,
    institution: text,
    field: text,
    major: text.optional(),
  }),
});

const skills = defineCollection({
  loader: file('src/content/skills.json'),
  schema: z.strictObject({
    id: text,
    order,
    title: text,
    items: z.array(text).min(1),
  }),
});

const projects = defineCollection({
  loader: file('src/content/projects.json'),
  schema: ({ image }) =>
    z.strictObject({
      id: text,
      order,
      title: text,
      type: text,
      stack: z.array(text).min(1),
      description: text,
      link: httpsUrl,
      /** Optional URL to request on page load, to wake a sleeping demo server. */
      wakeUrl: httpsUrl.optional(),
      size: z.enum(['large', 'small']),
      image: image(),
      imageAlt: text,
    }),
});

export const collections = { site, experience, education, skills, projects };
