import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const db = (env as any).DB;
    if (db) {
      const { results } = await db
        .prepare("SELECT * FROM ec_careers WHERE status = 'published' ORDER BY created_at ASC")
        .all();

      const jobs = (results || []).map((item: any, idx: number) => ({
        id: item.id || `job-${idx + 1}`,
        slug: item.job_slug || `job-${idx + 1}`,
        title: item.title || 'Posisi',
        dept: item.department || 'Operasional',
        type: item.job_type || 'Full-Time',
        exp: item.experience || '',
        location: item.location || 'Jakarta',
        email: item.application_email || 'recruitment@promind.id',
        desc: item.description || '',
        responsibilities: (item.responsibilities || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean),
        qualifications: (item.qualifications || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean),
        benefits: (item.benefits || '')
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean),
        published_at: item.published_at || item.created_at || '2026-10-17T13:00:00.000Z',
        created_at: item.created_at || '2026-10-17T13:00:00.000Z',
        status: item.status,
      }));

      return new Response(JSON.stringify({ jobs, total: jobs.length }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return new Response(JSON.stringify({ jobs: [], total: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, jobs: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
