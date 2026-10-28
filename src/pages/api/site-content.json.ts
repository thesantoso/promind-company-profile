import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB binding not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parallel fetch from D1 tables
    const [
      maintenanceRes,
      companyInfoRes,
      fieldworkRes,
      portfolioRes,
      researchRes,
      clientsRes,
      careersRes,
      heroSlidesRes,
      servicesRes,
      propertyScopesRes,
    ] = await Promise.all([
      db.prepare("SELECT * FROM ec_maintenance ORDER BY updated_at DESC LIMIT 1").first(),
      db.prepare("SELECT * FROM ec_company_info WHERE status = 'published' LIMIT 1").first(),
      db.prepare("SELECT * FROM ec_fieldwork WHERE status = 'published' ORDER BY step_number ASC").all(),
      db.prepare("SELECT * FROM ec_portfolio WHERE status = 'published' ORDER BY created_at ASC").all(),
      db.prepare("SELECT * FROM ec_research WHERE status = 'published' ORDER BY created_at ASC").all(),
      db.prepare("SELECT * FROM ec_clients WHERE status = 'published' ORDER BY created_at ASC").all(),
      db.prepare("SELECT * FROM ec_careers WHERE status = 'published' ORDER BY created_at ASC").all(),
      db.prepare("SELECT * FROM ec_hero_slides WHERE status = 'published' ORDER BY slide_order ASC").all(),
      db.prepare("SELECT * FROM ec_services WHERE status = 'published' ORDER BY service_number ASC").all(),
      db.prepare("SELECT * FROM ec_property_scopes WHERE status = 'published' ORDER BY scope_number ASC").all(),
    ]);

    const isMaint = maintenanceRes
      ? (maintenanceRes.is_maintenance === 1 || maintenanceRes.is_maintenance === '1' || maintenanceRes.is_maintenance === true || maintenanceRes.is_maintenance === 'true')
      : Boolean(companyInfoRes?.is_maintenance);

    const maintenance = {
      isMaintenance: Boolean(isMaint),
      title: maintenanceRes?.title || 'Sistem Sedang Dalam Pemeliharaan',
      message: maintenanceRes?.maintenance_message || companyInfoRes?.maintenance_message || '',
      estimatedDuration: maintenanceRes?.estimated_duration || companyInfoRes?.maintenance_estimate || '',
      emergencyContact: maintenanceRes?.emergency_contact || companyInfoRes?.email || '',
    };

    // Format company info
    const companyInfo = companyInfoRes ? {
      companyName: companyInfoRes.company_name,
      shortName: companyInfoRes.short_name,
      tagline: companyInfoRes.tagline,
      subTagline: companyInfoRes.sub_tagline,
      hq: companyInfoRes.address,
      email: companyInfoRes.email,
      phone: companyInfoRes.phone,
      whatsapp: companyInfoRes.whatsapp,
      isMaintenance: Boolean(isMaint),
      maintenanceMessage: maintenanceRes?.maintenance_message || companyInfoRes.maintenance_message || '',
      maintenanceEstimate: maintenanceRes?.estimated_duration || companyInfoRes.maintenance_estimate || '',
    } : null;

    // Format fieldwork
    const fieldwork = (fieldworkRes.results || []).map((item: any) => ({
      num: item.step_number,
      title: item.title,
      desc: item.description,
      photo: item.photo_url,
    }));

    // Format portfolio
    const portfolio = (portfolioRes.results || []).map((item: any) => ({
      name: item.title,
      sector: item.sector,
      scope: item.scope,
      location: item.location || '',
    }));

    // Format research
    const research = (researchRes.results || []).map((item: any, idx: number) => ({
      id: `rep-${idx + 1}`,
      category: item.category,
      title: item.title,
      summary: item.summary,
      highlights: (item.highlights || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean),
    }));

    // Format clients
    const clients = (clientsRes.results || []).map((item: any) => [
      item.name,
      item.sector,
    ]);

    // Format careers
    const careers = (careersRes.results || []).map((item: any, idx: number) => ({
      id: item.id || `job-${idx + 1}`,
      slug: item.job_slug || `job-${idx + 1}`,
      title: item.title,
      dept: item.department,
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
    }));

    // Format hero slides
    const heroSlides = (heroSlidesRes.results || []).map((item: any) => ({
      url: item.image_url,
      alt: item.alt_text || item.title || 'Foto Hero PROMIND',
      title: item.title || '',
    }));

    // Format services (cakupan layanan)
    const services = (servicesRes.results || []).map((item: any) => ({
      num: item.service_number,
      title: item.title,
      desc: item.description,
      deliverables: (item.deliverables || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean),
    }));

    // Format property scopes (cakupan properti di beranda)
    const propertyScopes = (propertyScopesRes.results || []).map((item: any) => ({
      num: item.scope_number,
      title: item.title,
      desc: item.description,
    }));

    return new Response(JSON.stringify({
      maintenance,
      companyInfo,
      fieldwork,
      portfolio,
      research,
      clients,
      careers,
      heroSlides,
      services,
      propertyScopes,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
