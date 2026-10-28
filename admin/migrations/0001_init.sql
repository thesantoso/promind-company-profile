-- Portal admin PROMIND: user, sesi, undangan, draft, log audit.
-- Waktu disimpan sebagai detik Unix (INTEGER). Boolean sebagai 0/1.

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'editor')),
  password_hash TEXT NOT NULL,
  totp_secret_enc TEXT,
  totp_confirmed INTEGER NOT NULL DEFAULT 0,
  totp_last_step INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'editor')),
  created_by INTEGER REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  csrf_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX login_attempts_key_ts ON login_attempts(key, ts);

CREATE TABLE recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  code_hash TEXT NOT NULL,
  used_at INTEGER
);
CREATE INDEX recovery_codes_user ON recovery_codes(user_id);

CREATE TABLE drafts (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  base_sha TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at INTEGER NOT NULL
);

CREATE TABLE draft_images (
  path TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT
);
CREATE INDEX audit_log_ts ON audit_log(ts);
