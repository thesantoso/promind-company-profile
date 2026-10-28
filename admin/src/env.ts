export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Kunci AES-GCM 32 byte (base64) untuk rahasia TOTP. Secret Worker. */
  ENCRYPTION_KEY: string;
  /** Token GitHub fine-grained: hanya Contents read/write pada repo. Secret Worker. */
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  ADMIN_ORIGIN: string;
  SITE_ORIGIN: string;
  /** Kunci HMAC bersama dengan endpoint PHP form kontak. Secret Worker. */
  CONTACT_HMAC_KEY: string;
  CONTACT_MAILER_URL: string;
  TURNSTILE_SECRET: string;
}
