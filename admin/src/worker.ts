import { Hono } from 'hono';
import { AuthError } from './auth';
import { originCheck, securityHeaders, type AppEnv } from './middleware';
import { authRoutes } from './routes/auth';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('/api/*', securityHeaders);
  app.use('/api/*', originCheck);
  app.route('/api/auth', authRoutes);

  app.notFound((c) => (c.req.path.startsWith('/api/') ? c.json({ error: 'not_found' }, 404) : c.env.ASSETS.fetch(c.req.raw)));

  app.onError((err, c) => {
    if (err instanceof AuthError) {
      const res = c.json({ error: err.code }, err.status as 400);
      if (err.retryAfter) res.headers.set('Retry-After', String(err.retryAfter));
      return res;
    }
    if (err instanceof Error && err.name === 'ZodError') return c.json({ error: 'bad_request' }, 400);
    console.error('unhandled', err instanceof Error ? err.message : err);
    return c.json({ error: 'internal' }, 500);
  });

  return app;
}

const app = createApp();
export default { fetch: app.fetch };
