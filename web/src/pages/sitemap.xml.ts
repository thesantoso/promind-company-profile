import type { APIRoute } from 'astro';
import { buildSitemap } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) =>
  new Response(buildSitemap(site!.href), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
