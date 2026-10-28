/** Isi dist/version.json: commit yang sedang dibangun, agar portal admin tahu kapan perubahan sudah live. */
export function buildVersion(env, now = new Date()) {
  const sha = String(env.GITHUB_SHA ?? '').trim();
  return { commit: /^[0-9a-f]{7,40}$/i.test(sha) ? sha.toLowerCase() : 'local', builtAt: now.toISOString() };
}
