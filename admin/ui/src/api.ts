/**
 * Klien API same-origin. Token sesi ada di cookie HttpOnly; token CSRF hanya di memori
 * dan dikirim sebagai `X-CSRF-Token` pada setiap permintaan selain GET.
 */

export type Role = 'administrator' | 'editor';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  totpConfirmed: boolean;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface Issue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly body: Record<string, unknown> = {},
    readonly retryAfter?: number,
  ) {
    super(code);
  }
}

let csrfToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setCsrf(token: string | null): void {
  csrfToken = token;
}

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

interface Options {
  /** Untuk panggilan tanpa sesi (masuk, undangan, 2FA): 401 bukan berarti sesi habis. */
  anonymous?: boolean;
  form?: FormData;
}

export async function api<T = unknown>(method: string, path: string, body?: unknown, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  let payload: BodyInit | undefined;
  if (opts.form) payload = opts.form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: payload, credentials: 'same-origin', cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'network');
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const code = typeof data.error === 'string' ? data.error : res.status >= 500 ? 'internal' : 'bad_request';
    const retry = Number(res.headers.get('Retry-After') ?? '') || undefined;
    // Hanya `unauthenticated` berarti sesi habis; 401 `invalid_credentials` (mis. kata sandi lama salah) bukan.
    if (res.status === 401 && code === 'unauthenticated' && !opts.anonymous) onUnauthorized?.();
    throw new ApiError(res.status, code, data, retry);
  }
  return data as T;
}

export const get = <T>(path: string) => api<T>('GET', path);
export const post = <T>(path: string, body?: unknown, opts?: Options) => api<T>('POST', path, body ?? {}, opts);
export const put = <T>(path: string, body: unknown) => api<T>('PUT', path, body);
export const patch = <T>(path: string, body: unknown) => api<T>('PATCH', path, body);
export const del = <T>(path: string) => api<T>('DELETE', path);

export const codeOf = (e: unknown): string => (e instanceof ApiError ? e.code : 'network');
