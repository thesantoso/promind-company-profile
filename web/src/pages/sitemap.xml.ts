import type { APIRoute } from 'astro';
import { loadJobs } from '../content/load';
import { jobSitemapPaths } from '../lib/job-paths';
import { buildSitemap } from '../lib/sitemap';
import { todayUtc } from '../lib/today';

export const GET: APIRoute = ({ site }) =>
  new Response(buildSitemap(site!.href, jobSitemapPaths(loadJobs(), todayUtc())), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
