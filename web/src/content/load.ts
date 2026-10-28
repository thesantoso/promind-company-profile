import type { ZodType } from 'zod';
import services from '../../content/services.json';
import propertyTypes from '../../content/property-types.json';
import pillars from '../../content/pillars.json';
import fieldwork from '../../content/fieldwork.json';
import engagement from '../../content/engagement.json';
import standards from '../../content/standards.json';
import portfolio from '../../content/portfolio.json';
import clients from '../../content/clients.json';
import insights from '../../content/insights.json';
import careers from '../../content/careers.json';
import {
  clientSchema, engagementSchema, fieldworkSchema, insightSchema, jobSchema, pillarSchema,
  portfolioSchema, propertyTypeSchema, serviceSchema, standardSchema,
  type Client, type Engagement, type Fieldwork, type Insight, type Job, type Pillar,
  type PortfolioItem, type PropertyType, type Service, type Standard,
} from './schema';

export function assertUniqueSlugs<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  for (const { slug } of items) {
    if (seen.has(slug)) throw new Error(`duplicate slug: ${slug}`);
    seen.add(slug);
  }
  return items;
}

function parseAll<T>(schema: ZodType<T>, data: unknown): T[] {
  return (data as unknown[]).map((item) => schema.parse(item));
}

export const loadServices = (): Service[] => assertUniqueSlugs(parseAll(serviceSchema, services));
export const loadPropertyTypes = (): PropertyType[] => assertUniqueSlugs(parseAll(propertyTypeSchema, propertyTypes));
export const loadPillars = (): Pillar[] => assertUniqueSlugs(parseAll(pillarSchema, pillars));
export const loadFieldwork = (): Fieldwork[] => assertUniqueSlugs(parseAll(fieldworkSchema, fieldwork));
export const loadEngagement = (): Engagement[] => assertUniqueSlugs(parseAll(engagementSchema, engagement));
export const loadStandards = (): Standard[] => parseAll(standardSchema, standards);
export const loadPortfolio = (): PortfolioItem[] => parseAll(portfolioSchema, portfolio);
export const loadClients = (): Client[] => parseAll(clientSchema, clients);
export const loadInsights = (): Insight[] => assertUniqueSlugs(parseAll(insightSchema, insights));
export const loadJobs = (): Job[] => assertUniqueSlugs(parseAll(jobSchema, careers));

/** `today` is a date-only string (YYYY-MM-DD, UTC). A job is open through its validThrough date. */
export function filterActiveJobs(jobs: Job[], today: string): Job[] {
  return jobs.filter((j) => j.active && (!j.validThrough || j.validThrough >= today));
}
export const loadActiveJobs = (today: string): Job[] => filterActiveJobs(loadJobs(), today);
