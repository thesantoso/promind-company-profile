// Worker situs publik: berkas statis dari ASSETS, dan hanya /api/contact diteruskan ke Worker admin
// (service binding). API admin lainnya tidak pernah terbuka di domain publik.
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return env.ADMIN.fetch(request);
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return env.ASSETS.fetch(request);
  },
};
