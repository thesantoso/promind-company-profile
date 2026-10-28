import type { APIRoute } from 'astro';
import { loadPages } from '../content/load';
import { buildLlmsTxt } from '../lib/jsonld';

export const GET: APIRoute = ({ site }) =>
  new Response(buildLlmsTxt(site!.href, loadPages()), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
