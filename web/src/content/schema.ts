import { z } from 'zod';
import { ROUTES, type RouteKey } from '../i18n/routes';
import settings from '../../content/settings.json';

const text = z.string().trim().min(1);

export const bilingualText = z.object({ id: text, en: text });
export type BilingualText = z.infer<typeof bilingualText>;

export const bilingualImage = z.object({
  src: z.string().min(1),
  alt: bilingualText,
});
export type BilingualImage = z.infer<typeof bilingualImage>;

export const siteSettingsSchema = z.object({
  legalName: text,
  brand: z.literal('PROMIND'),
  address: bilingualText,
  email: z.email(),
  phone: text,
  whatsapp: text,
  hours: bilingualText,
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export function loadSettings(): SiteSettings {
  return siteSettingsSchema.parse(settings);
}

export const blList = z
  .object({ id: z.array(text).min(1), en: z.array(text).min(1) })
  .refine((v) => v.id.length === v.en.length, { message: 'id and en lists must have the same length' });
export type BilingualList = z.infer<typeof blList>;

export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, { message: 'invalid calendar date' });

export const serviceSchema = z.object({ slug, title: bilingualText, summary: bilingualText, deliverables: blList });
export const propertyTypeSchema = z.object({ slug, title: bilingualText, summary: bilingualText, detail: bilingualText });
export const pillarSchema = z.object({ slug, title: bilingualText, summary: bilingualText });
export const fieldworkSchema = z.object({ slug, title: bilingualText, summary: bilingualText, image: bilingualImage });
export const engagementSchema = z.object({ slug, title: bilingualText, summary: bilingualText });
export const standardSchema = z.object({ code: text, name: bilingualText });
export const portfolioSchema = z.object({
  name: text,
  sector: bilingualText,
  scope: bilingualText,
  location: bilingualText,
});
export const clientSchema = z.object({ name: text, category: bilingualText });
export const insightSchema = z.object({
  slug,
  category: bilingualText,
  title: bilingualText,
  summary: bilingualText,
  highlights: blList,
});
export const jobSchema = z.object({
  slug,
  title: bilingualText,
  department: bilingualText,
  type: bilingualText,
  experience: bilingualText,
  location: bilingualText,
  summary: bilingualText,
  responsibilities: blList,
  qualifications: blList,
  benefits: blList,
  applicationEmail: z.email(),
  postedAt: dateOnly,
  validThrough: dateOnly.optional(),
  active: z.boolean(),
});

export type Service = z.infer<typeof serviceSchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type Pillar = z.infer<typeof pillarSchema>;
export type Fieldwork = z.infer<typeof fieldworkSchema>;
export type Engagement = z.infer<typeof engagementSchema>;
export type Standard = z.infer<typeof standardSchema>;
export type PortfolioItem = z.infer<typeof portfolioSchema>;
export type Client = z.infer<typeof clientSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type Job = z.infer<typeof jobSchema>;

const routeKey = z.enum(Object.keys(ROUTES) as [RouteKey, ...RouteKey[]]);
const heading = z.object({ eyebrow: bilingualText, title: bilingualText });
const seo = z.object({ title: bilingualText, description: bilingualText });

export const pagesSchema = z.object({
  home: z.object({
    seo,
    hero: z.object({
      eyebrow: bilingualText,
      title: bilingualText,
      description: bilingualText,
      cta: z.object({ label: bilingualText, route: routeKey }),
    }),
    focus: heading.extend({ body: bilingualText }),
    sectors: heading.extend({ subtitle: bilingualText }),
    fieldwork: heading.extend({ subtitle: bilingualText }),
    technology: heading.extend({
      description: bilingualText,
      steps: z.array(z.object({ title: bilingualText, summary: bilingualText })).length(3),
    }),
  }),
  services: z.object({ seo, ...heading.shape, subtitle: bilingualText, engagementTitle: bilingualText }),
  portfolio: z.object({ seo, ...heading.shape, subtitle: bilingualText, clientsTitle: bilingualText }),
  insights: z.object({ seo, ...heading.shape, subtitle: bilingualText }),
  about: z.object({ seo, ...heading.shape, story: blList, pillarsTitle: bilingualText, standardsTitle: bilingualText }),
  careers: z.object({
    seo, ...heading.shape, subtitle: bilingualText,
    culture: z.array(z.object({ title: bilingualText, summary: bilingualText })).min(1),
    openRolesTitle: bilingualText,
    emptyText: bilingualText,
  }),
  contact: z.object({ seo, ...heading.shape, subtitle: bilingualText, serviceAreas: blList, ctaLabel: bilingualText }),
});
export type Pages = z.infer<typeof pagesSchema>;
