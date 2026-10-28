import { Hono } from 'hono';
import { AuthError } from './auth';
import { ConflictError, GitHubError } from './github';
import { originCheck, securityHeaders, type AppEnv } from './middleware';
import { PublishError } from './publish';
import { authRoutes } from './routes/auth';
import { contentRoutes, publishRoutes } from './routes/content';
import { auditRoutes, usersRoutes } from './routes/users';

const PUBLISH_STATUS = { invalid: 422, no_draft: 409, conflict: 409, draft_exists: 409, not_found: 404, too_large: 413 } as const;

export function createApp(options: { fetchImpl?: typeof fetch } = {}) {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('fetchImpl', options.fetchImpl ?? fetch);
    await next();
  });
  app.use('/api/*', securityHeaders);
  app.use('/api/*', originCheck);
  app.route('/api/auth', authRoutes);
  app.route('/api/users', usersRoutes);
  app.route('/api/audit', auditRoutes);
  app.route('/api/content', contentRoutes);
  app.route('/api/publish', publishRoutes);

  app.notFound((c) => (c.req.path.startsWith('/api/') ? c.json({ error: 'not_found' }, 404) : c.env.ASSETS.fetch(c.req.raw)));

  app.onError((err, c) => {
    if (err instanceof AuthError) {
      const res = c.json({ error: err.code }, err.status as 400);
      if (err.retryAfter) res.headers.set('Retry-After', String(err.retryAfter));
      return res;
    }
    if (err instanceof PublishError) {
      const body: Record<string, unknown> = { error: err.code };
      if (err.issues.length) body.issues = err.issues;
      if (err.key) body.key = err.key;
      return c.json(body, PUBLISH_STATUS[err.code]);
    }
    if (err instanceof ConflictError) return c.json({ error: 'repo_busy' }, 409);
    if (err instanceof GitHubError) {
      console.error('github', err.status, err.message);
      return c.json({ error: 'github_unavailable' }, 502);
    }
    if (err instanceof Error && err.name === 'ZodError') return c.json({ error: 'bad_request' }, 400);
    console.error('unhandled', err instanceof Error ? err.message : err);
    return c.json({ error: 'internal' }, 500);
  });

  return app;
}

const app = createApp();
export default { fetch: app.fetch };
