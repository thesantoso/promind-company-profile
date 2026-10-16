import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInquiryMailto } from './inquiry.js';

test('builds a bilingual-ready property inquiry email from structured form data', () => {
  const link = buildInquiryMailto('corporate@promind.id', 'Diskusi kebutuhan manajemen properti', {
    name: 'Budi Santoso',
    company: 'PT Contoh Properti',
    email: 'budi@example.com',
    phone: '08123456789',
    propertyType: 'Office building',
    location: 'Jakarta',
    need: 'Property assessment',
    message: 'Kami sedang meninjau operasional gedung.',
  });

  assert.match(link, /^mailto:corporate@promind\.id\?/);
  assert.match(decodeURIComponent(link), /Budi Santoso/);
  assert.match(decodeURIComponent(link), /PT Contoh Properti/);
  assert.match(decodeURIComponent(link), /Office building/);
  assert.match(decodeURIComponent(link), /Kami sedang meninjau operasional gedung\./);
});

test('omits blank optional values without leaving empty labels', () => {
  const link = buildInquiryMailto('corporate@promind.id', 'Property management enquiry', {
    name: 'Sarah',
    company: '',
    email: 'sarah@example.com',
    phone: '',
    propertyType: 'Apartment',
    location: '',
    need: 'Integrated property management',
    message: '',
  });

  const decoded = decodeURIComponent(link);
  assert.doesNotMatch(decoded, /Company:/);
  assert.doesNotMatch(decoded, /Phone:/);
  assert.doesNotMatch(decoded, /Location:/);
});
