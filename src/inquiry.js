export function buildInquiryMailto(recipient, subject, values) {
  const fields = [
    ['Name', values.name],
    ['Company', values.company],
    ['Email', values.email],
    ['Phone', values.phone],
    ['Property type', values.propertyType],
    ['Location', values.location],
    ['Service needed', values.need],
    ['Additional context', values.message],
  ];

  const body = fields
    .filter(([, value]) => value?.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join('\n');

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
