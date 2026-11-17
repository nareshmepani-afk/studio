import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

export const STAGING_PROJECT_ID = 'memory-weaver-dev';
export const STAGING_STORAGE_BUCKET = 'memory-weaver-dev.firebasestorage.app';
const APP_NAME = 'qa-staging-admin';

export interface ServiceAccountLike {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
}

export function parseServiceAccountConfig(raw?: string | null): ServiceAccountLike | null {
  if (!raw || typeof raw !== 'string') return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      try {
        const unquoted = JSON.parse(trimmed);
        if (typeof unquoted === 'string') {
          trimmed = unquoted.trim();
        } else if (unquoted && typeof unquoted === 'object') {
          trimmed = JSON.stringify(unquoted);
        }
      } catch {
        trimmed = trimmed.slice(1, -1);
      }
    }

    const parsed = JSON.parse(trimmed) as ServiceAccountLike;
    if (parsed && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch {
    return null;
  }
}

export function assertStagingServiceAccount(sa: ServiceAccountLike | null | undefined): ServiceAccountLike {
  if (!sa || !sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error(
      `Missing valid ${STAGING_PROJECT_ID} service account credentials. Save a rotated staging service account JSON to .env.staging.local (gitignored) or set STAGING_SERVICE_ACCOUNT_JSON.`
    );
  }
  if (sa.project_id !== STAGING_PROJECT_ID) {
    throw new Error(
      `REFUSED: Refusing to run staging QA scripts against project "${sa.project_id}". Expected "${STAGING_PROJECT_ID}". Keep production credentials out of staging QA scripts.`
    );
  }
  return sa;
}

function readServiceAccountFromEnvFile(filePath: string): ServiceAccountLike | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) return null;

  // Support placing the downloaded Google Cloud JSON directly inside .env.staging.local
  if (content.startsWith('{')) {
    return parseServiceAccountConfig(content);
  }

  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const match = t.match(/^(?:STAGING_SERVICE_ACCOUNT_JSON|SERVICE_ACCOUNT_JSON)\s*=\s*(.+)$/);
    if (match) {
      return parseServiceAccountConfig(match[1]);
    }
  }
  return null;
}

export function resolveStagingServiceAccount(rootDir = process.cwd()): ServiceAccountLike {
  const fromStagingEnvVar = parseServiceAccountConfig(process.env.STAGING_SERVICE_ACCOUNT_JSON);
  if (fromStagingEnvVar) {
    return assertStagingServiceAccount(fromStagingEnvVar);
  }

  const stagingEnvFile = path.resolve(rootDir, '.env.staging.local');
  const fromStagingFile = readServiceAccountFromEnvFile(stagingEnvFile);
  if (fromStagingFile) {
    return assertStagingServiceAccount(fromStagingFile);
  }

  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gacPath && fs.existsSync(gacPath)) {
    const fromGac = parseServiceAccountConfig(fs.readFileSync(gacPath, 'utf8'));
    if (fromGac) {
      return assertStagingServiceAccount(fromGac);
    }
  }

  const fromGenericEnv = parseServiceAccountConfig(process.env.SERVICE_ACCOUNT_JSON);
  if (fromGenericEnv) {
    return assertStagingServiceAccount(fromGenericEnv);
  }

  throw new Error(
    `No staging Admin SDK credentials found for ${STAGING_PROJECT_ID}. Place the rotated staging SA JSON in ${stagingEnvFile} (gitignored) or set STAGING_SERVICE_ACCOUNT_JSON.`
  );
}

export function getStagingAdmin(rootDir = process.cwd()): {
  app: App;
  adminDb: Firestore;
  adminAuth: Auth;
  adminStorage: Storage;
  projectId: string;
} {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) {
    return {
      app: existing,
      adminDb: getFirestore(existing),
      adminAuth: getAuth(existing),
      adminStorage: getStorage(existing),
      projectId: STAGING_PROJECT_ID,
    };
  }

  const sa = resolveStagingServiceAccount(rootDir);
  const app = initializeApp(
    {
      credential: cert(sa as any),
      projectId: STAGING_PROJECT_ID,
      storageBucket: STAGING_STORAGE_BUCKET,
    },
    APP_NAME
  );

  return {
    app,
    adminDb: getFirestore(app),
    adminAuth: getAuth(app),
    adminStorage: getStorage(app),
    projectId: STAGING_PROJECT_ID,
  };
}
