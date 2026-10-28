import { describe, expect, test } from 'vitest';
import { loadJobs, loadPages, loadServices } from '../content/load';
import { loadSettings } from '../content/schema';
import { breadcrumbLd, buildLlmsTxt, employmentTypeFor, jobPostingLd, organizationLd, serializeLd, serviceLd } from './jsonld';

const SITE = 'https://promind.co.id';
const settings = loadSettings();
const job = loadJobs()[0];

const noUndefined = (v: unknown): boolean =>
  v === undefined ? false : Array.isArray(v) ? v.every(noUndefined) : v && typeof v === 'object' ? Object.values(v).every(noUndefined) : true;

describe('organizationLd', () => {
  const ld = organizationLd('en', settings, SITE) as any;

  test('describes the company with the brand name and real contact data', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('ProfessionalService');
    expect(ld.name).toBe(settings.legalName);
    expect(ld.alternateName).toBe('PROMIND');
    expect(ld.email).toBe(settings.email);
    expect(ld.telephone).toBe(settings.phone);
    expect(ld.address.streetAddress).toBe(settings.address.en);
    expect(ld['@id']).toBe(`${SITE}/#organization`);
  });

  test('has no undefined values', () => {
    expect(noUndefined(ld)).toBe(true);
  });
});

describe('serviceLd', () => {
  test('references the organization as provider and uses the localized text', () => {
    const s = loadServices()[0];
    const ld = serviceLd(s, 'id', SITE) as any;
    expect(ld['@type']).toBe('Service');
    expect(ld.name).toBe(s.title.id);
    expect(ld.description).toBe(s.summary.id);
    expect(ld.provider).toEqual({ '@id': `${SITE}/#organization` });
  });
});

describe('breadcrumbLd', () => {
  test('positions start at 1 and urls are absolute', () => {
    const ld = breadcrumbLd([{ name: 'Home', path: '/en/' }, { name: 'Careers', path: '/en/careers/' }], SITE) as any;
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toBe(`${SITE}/en/careers/`);
  });
});

describe('jobPostingLd', () => {
  test('uses the posting date and omits validThrough when the job is open-ended', () => {
    const ld = jobPostingLd({ ...job, validThrough: undefined }, 'en', SITE, settings) as any;
    expect(ld['@type']).toBe('JobPosting');
    expect(ld.datePosted).toBe(job.postedAt);
    expect('validThrough' in ld).toBe(false);
    expect(ld.title).toBe(job.title.en);
    expect(ld.hiringOrganization.name).toBe(settings.legalName);
    expect(ld.employmentType).toBe('FULL_TIME');
    expect(ld.directApply).toBe(false);
    expect(ld.jobLocation.address.addressCountry).toBe('ID');
    expect(noUndefined(ld)).toBe(true);
  });

  test('includes validThrough when present and escapes HTML in the description', () => {
    const j = { ...job, validThrough: '2026-12-31', summary: { id: 'a', en: 'Lead <b>teams</b> & budgets' } };
    const ld = jobPostingLd(j, 'en', SITE, settings) as any;
    expect(ld.validThrough).toBe('2026-12-31');
    expect(ld.description).toContain('Lead &lt;b&gt;teams&lt;/b&gt; &amp; budgets');
    expect(ld.description).not.toContain('<b>');
  });

  test('maps employment types', () => {
    expect(employmentTypeFor('Full-time')).toBe('FULL_TIME');
    expect(employmentTypeFor('Part-time')).toBe('PART_TIME');
    expect(employmentTypeFor('Contract')).toBe('CONTRACTOR');
    expect(employmentTypeFor('Something else')).toBe('OTHER');
  });
});

describe('serializeLd', () => {
  test('cannot close the script tag early', () => {
    const out = serializeLd({ a: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out).a).toBe('</script><script>alert(1)</script>');
  });
});

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt(SITE, loadPages());

  test('starts with the brand and lists every static route in both languages with absolute urls', () => {
    expect(txt.startsWith('# PROMIND\n')).toBe(true);
    for (const path of ['/id/', '/id/layanan/', '/id/tentang-kami/', '/en/', '/en/services/', '/en/careers/', '/en/contact/']) {
      expect(txt).toContain(`](${SITE}${path})`);
    }
    expect(txt.match(/^- \[/gm)).toHaveLength(14);
  });

  test('describes each page from its SEO description', () => {
    expect(txt).toContain(loadPages().services.seo.description.en);
  });
});
