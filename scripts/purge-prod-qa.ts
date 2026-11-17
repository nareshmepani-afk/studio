import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { parseServiceAccountConfig, type ServiceAccountLike } from './lib/stagingAdmin';

export const PRODUCTION_PROJECT_ID = 'memory-weaver-8rk9t';
export const PRODUCTION_STORAGE_BUCKET = 'memory-weaver-8rk9t.firebasestorage.app';
const APP_NAME = 'mw-409-prod-purge';

export interface PurgeExecutionPlan {
  projectId: string;
  dryRun: boolean;
  includeStorage: boolean;
}

/**
 * Fails closed unless credentials explicitly belong to production (`memory-weaver-8rk9t`).
 * Refuses staging (`memory-weaver-dev`) and requires `--confirm-prod` to leave dry-run mode.
 */
export function assertProdPurgeTarget(
  sa: ServiceAccountLike | null | undefined,
  argv: string[] = []
): PurgeExecutionPlan {
  if (!sa || !sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error(
      `Missing valid ${PRODUCTION_PROJECT_ID} service account credentials. Provide SERVICE_ACCOUNT_JSON / PROD_SERVICE_ACCOUNT_JSON for ${PRODUCTION_PROJECT_ID}.`
    );
  }
  if (sa.project_id !== PRODUCTION_PROJECT_ID) {
    throw new Error(
      `REFUSED: Refusing to run MW-409 prod purge against project "${sa.project_id}". Expected "${PRODUCTION_PROJECT_ID}". Staging must never be purged by this script.`
    );
  }

  const confirmProd = argv.includes('--confirm-prod');
  const includeStorage = argv.includes('--include-storage');

  return {
    projectId: PRODUCTION_PROJECT_ID,
    dryRun: !confirmProd,
    includeStorage,
  };
}

function readProdServiceAccountFromDotEnvLocal(rootDir: string): ServiceAccountLike | null {
  const envLocalPath = path.resolve(rootDir, '.env.local');
  if (!fs.existsSync(envLocalPath)) return null;
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:PROD_SERVICE_ACCOUNT_JSON|SERVICE_ACCOUNT_JSON)\s*=\s*(.+)$/);
    if (match) {
      return parseServiceAccountConfig(match[1]);
    }
  }
  return null;
}

export function resolveProdServiceAccount(rootDir = process.cwd()): ServiceAccountLike {
  const fromProdEnv = parseServiceAccountConfig(process.env.PROD_SERVICE_ACCOUNT_JSON);
  if (fromProdEnv) {
    assertProdPurgeTarget(fromProdEnv, []);
    return fromProdEnv;
  }

  const fromEnv = parseServiceAccountConfig(process.env.SERVICE_ACCOUNT_JSON);
  if (fromEnv) {
    assertProdPurgeTarget(fromEnv, []);
    return fromEnv;
  }

  const fromDotEnvLocal = readProdServiceAccountFromDotEnvLocal(rootDir);
  if (fromDotEnvLocal) {
    assertProdPurgeTarget(fromDotEnvLocal, []);
    return fromDotEnvLocal;
  }

  throw new Error(
    `No ${PRODUCTION_PROJECT_ID} Admin SDK credentials found in PROD_SERVICE_ACCOUNT_JSON, SERVICE_ACCOUNT_JSON, or .env.local.`
  );
}

function getProdAdmin(sa: ServiceAccountLike): { app: App; adminDb: Firestore; adminStorage: Storage } {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) {
    return {
      app: existing,
      adminDb: getFirestore(existing),
      adminStorage: getStorage(existing),
    };
  }

  const app = initializeApp(
    {
      credential: cert(sa as any),
      projectId: PRODUCTION_PROJECT_ID,
      storageBucket: PRODUCTION_STORAGE_BUCKET,
    },
    APP_NAME
  );

  return {
    app,
    adminDb: getFirestore(app),
    adminStorage: getStorage(app),
  };
}

async function listCollectionDocsRecursively(
  colRef: FirebaseFirestore.CollectionReference
): Promise<string[]> {
  const docPaths: string[] = [];
  const docRefs = await colRef.listDocuments();
  for (const docRef of docRefs) {
    docPaths.push(docRef.path);
    const subCols = await docRef.listCollections();
    for (const subCol of subCols) {
      const nested = await listCollectionDocsRecursively(subCol);
      docPaths.push(...nested);
    }
  }
  return docPaths;
}

export async function runProdQaPurge(argv: string[] = process.argv.slice(2), rootDir = process.cwd()) {
  const sa = resolveProdServiceAccount(rootDir);
  const plan = assertProdPurgeTarget(sa, argv);
  const { adminDb, adminStorage } = getProdAdmin(sa);

  console.log(`🧹 MW-409 Production Hygiene Audit [${plan.projectId}]`);
  console.log(`Mode: ${plan.dryRun ? 'DRY-RUN (read-only; pass --confirm-prod to delete)' : 'LIVE PURGE (--confirm-prod supplied)'}`);

  const qaSuitesRef = adminDb.collection('qa_suites');
  const discoveredDocPaths = await listCollectionDocsRecursively(qaSuitesRef);

  console.log(`Firestore qa_suites paths discovered: ${discoveredDocPaths.length}`);
  for (const docPath of discoveredDocPaths.slice(0, 25)) {
    console.log(`   - ${docPath}`);
  }
  if (discoveredDocPaths.length > 25) {
    console.log(`   ... and ${discoveredDocPaths.length - 25} additional nested document(s).`);
  }

  let storageFileCount = 0;
  try {
    const [files] = await adminStorage.bucket().getFiles({ prefix: 'qa-evidence/' });
    storageFileCount = files.length;
    console.log(`Storage qa-evidence/ objects discovered: ${storageFileCount}`);
  } catch (err: any) {
    console.warn(`⚠️  Could not inspect default bucket (${PRODUCTION_STORAGE_BUCKET}) qa-evidence/: ${err?.message || err}`);
  }

  if (plan.dryRun) {
    if (discoveredDocPaths.length === 0 && storageFileCount === 0) {
      console.log('🟢 Production qa_suites and qa-evidence/ are already clean (0 items).');
    } else {
      console.log(
        `\nℹ️  DRY-RUN COMPLETE — zero records deleted. Re-run with:\n` +
          `   npx.cmd tsx scripts/purge-prod-qa.ts --confirm-prod`
      );
    }
    return { dryRun: true, firestorePaths: discoveredDocPaths.length, storageFiles: storageFileCount };
  }

  if (discoveredDocPaths.length > 0) {
    await adminDb.recursiveDelete(qaSuitesRef);
    console.log(`🗑️  Deleted Firestore collection qa_suites recursively (${discoveredDocPaths.length} path(s)).`);
  } else {
    console.log('✅ Firestore qa_suites already empty — nothing to delete.');
  }

  if (plan.includeStorage && storageFileCount > 0) {
    await adminStorage.bucket().deleteFiles({ prefix: 'qa-evidence/' });
    console.log(`🗑️  Deleted ${storageFileCount} object(s) under qa-evidence/ in ${PRODUCTION_STORAGE_BUCKET}.`);
  }

  return { dryRun: false, firestorePaths: discoveredDocPaths.length, storageFiles: storageFileCount };
}

if (require.main === module) {
  runProdQaPurge()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ MW-409 purge aborted:', err?.message || err);
      process.exit(1);
    });
}
