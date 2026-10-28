import { z } from 'zod';
import settings from '../data/settings.json';

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
