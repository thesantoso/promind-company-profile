import type { APIRoute } from 'astro';
import { buildRobots } from '../lib/sitemap';

export const GET: APIRoute = ({ site }) =>
  new Response(buildRobots(site!.href), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
