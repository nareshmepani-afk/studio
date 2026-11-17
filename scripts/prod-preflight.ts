import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const PRODUCTION_PROJECT_ID = 'memory-weaver-8rk9t';
export const CANONICAL_PROD_APP_URL = 'https://memoryweaver.studio';
export const STAGING_PROJECT_ID = 'memory-weaver-dev';
export const STAGING_SENDER_ID = '98973313245';

export interface AppHostingEnvEntry {
  variable: string;
  value?: string;
  secret?: string;
  availability?: string[];
}

export interface PreflightReport {
  passed: boolean;
  failures: string[];
  warnings: string[];
  mergedVariables: Record<string, AppHostingEnvEntry>;
}

const REQUIRED_PROD_OVERRIDES = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_BYPASS_CAPTCHA',
  'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
  'GOOGLE_CLOUD_PROJECT_ID',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_CACHE_BUST',
] as const;

const REQUIRED_SECRET_BINDINGS = [
  'SERVICE_ACCOUNT_JSON',
  'RESEND_API_KEY',
  'GUEST_SESSION_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

const FORBIDDEN_PROD_SUBSTRINGS: { pattern: RegExp; label: string }[] = [
  { pattern: /memory-weaver-dev/i, label: 'staging project ID (memory-weaver-dev)' },
  { pattern: /dev\.memoryweaver\.studio/i, label: 'staging hostname (dev.memoryweaver.studio)' },
  { pattern: new RegExp(STAGING_SENDER_ID), label: `staging messaging sender ID (${STAGING_SENDER_ID})` },
  { pattern: /placeholder/i, label: 'placeholder token' },
  { pattern: /rehearsal/i, label: 'rehearsal placeholder' },
  { pattern: /changeme/i, label: 'changeme placeholder' },
  { pattern: /\bmock[-_]/i, label: 'mock credential' },
  { pattern: /sk_test_|pk_test_|whsec_test/i, label: 'Stripe test-mode key' },
  { pattern: /localhost|127\.0\.0\.1/i, label: 'localhost URL' },
];

function stripYamlScalar(raw: string): string {
  let trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  const commentIdx = trimmed.indexOf(' #');
  if (commentIdx !== -1) {
    trimmed = trimmed.slice(0, commentIdx).trim();
  }
  return trimmed;
}

/**
 * Parses `env:` blocks from Firebase App Hosting YAML files (`apphosting*.yaml`).
 */
export function parseAppHostingEnv(yamlContent: string): AppHostingEnvEntry[] {
  const entries: AppHostingEnvEntry[] = [];
  let current: AppHostingEnvEntry | null = null;
  let inEnvSection = false;

  for (const rawLine of yamlContent.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (/^env\s*:\s*$/.test(trimmed)) {
      inEnvSection = true;
      continue;
    }

    if (inEnvSection && !rawLine.startsWith(' ') && !rawLine.startsWith('\t') && !trimmed.startsWith('-')) {
      inEnvSection = false;
    }

    if (!inEnvSection) continue;

    const varMatch = trimmed.match(/^-\s*variable\s*:\s*(.+)$/);
    if (varMatch) {
      if (current) entries.push(current);
      current = { variable: stripYamlScalar(varMatch[1]) };
      continue;
    }

    if (!current) continue;

    const valMatch = trimmed.match(/^value\s*:\s*(.+)$/);
    if (valMatch) {
      current.value = stripYamlScalar(valMatch[1]);
      continue;
    }

    const secMatch = trimmed.match(/^secret\s*:\s*(.+)$/);
    if (secMatch) {
      current.secret = stripYamlScalar(secMatch[1]);
      continue;
    }
  }

  if (current) entries.push(current);
  return entries;
}

/**
 * Simulates Firebase App Hosting overlay merging (`apphosting.yaml` + `apphosting.prod.yaml`).
 */
export function mergeAppHostingConfigs(
  baseEntries: AppHostingEnvEntry[],
  prodEntries: AppHostingEnvEntry[]
): Record<string, AppHostingEnvEntry> {
  const merged: Record<string, AppHostingEnvEntry> = {};
  for (const entry of baseEntries) {
    merged[entry.variable] = { ...entry };
  }
  for (const entry of prodEntries) {
    merged[entry.variable] = { ...entry };
  }
  return merged;
}

/**
 * Fails closed if any dev/placeholder config leaks into the effective production App Hosting config.
 */
export function validateMergedProdConfig(
  baseEntries: AppHostingEnvEntry[],
  prodEntries: AppHostingEnvEntry[]
): string[] {
  const failures: string[] = [];
  const prodByKey = Object.fromEntries(prodEntries.map((e) => [e.variable, e]));
  const merged = mergeAppHostingConfigs(baseEntries, prodEntries);

  for (const key of REQUIRED_PROD_OVERRIDES) {
    const entry = prodByKey[key];
    if (!entry || (!entry.value && !entry.secret)) {
      failures.push(`apphosting.prod.yaml is missing required explicit override for "${key}".`);
    }
  }

  const bypassEntry = merged['NEXT_PUBLIC_BYPASS_CAPTCHA'];
  if (!bypassEntry || bypassEntry.value !== 'false') {
    failures.push(
      `NEXT_PUBLIC_BYPASS_CAPTCHA in effective prod config must be explicitly "false" (got ${JSON.stringify(bypassEntry?.value)}).`
    );
  }

  const projEntry = merged['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
  if (!projEntry || projEntry.value !== PRODUCTION_PROJECT_ID) {
    failures.push(
      `NEXT_PUBLIC_FIREBASE_PROJECT_ID in effective prod config must be "${PRODUCTION_PROJECT_ID}" (got ${JSON.stringify(projEntry?.value)}).`
    );
  }

  const gcpEntry = merged['GOOGLE_CLOUD_PROJECT_ID'];
  if (!gcpEntry || gcpEntry.value !== PRODUCTION_PROJECT_ID) {
    failures.push(
      `GOOGLE_CLOUD_PROJECT_ID in effective prod config must be "${PRODUCTION_PROJECT_ID}" (got ${JSON.stringify(gcpEntry?.value)}).`
    );
  }

  const recaptchaEntry = merged['NEXT_PUBLIC_RECAPTCHA_SITE_KEY'];
  const siteKeyVal = recaptchaEntry?.value || '';
  if (!siteKeyVal || !siteKeyVal.startsWith('6L') || siteKeyVal.length < 20) {
    failures.push(
      `NEXT_PUBLIC_RECAPTCHA_SITE_KEY must be a real reCAPTCHA Enterprise site key starting with "6L" (got ${JSON.stringify(siteKeyVal)}).`
    );
  }

  const appUrlEntry = merged['NEXT_PUBLIC_APP_URL'];
  const appUrlVal = appUrlEntry?.value || '';
  if (appUrlVal !== CANONICAL_PROD_APP_URL) {
    failures.push(
      `NEXT_PUBLIC_APP_URL in apphosting.prod.yaml must be canonical apex "${CANONICAL_PROD_APP_URL}" (got ${JSON.stringify(appUrlVal)}).`
    );
  }

  const baseCacheBust = baseEntries.find((e) => e.variable === 'NEXT_PUBLIC_CACHE_BUST')?.value;
  const prodCacheBust = prodByKey['NEXT_PUBLIC_CACHE_BUST']?.value;
  if (!prodCacheBust || (baseCacheBust && prodCacheBust === baseCacheBust)) {
    failures.push('NEXT_PUBLIC_CACHE_BUST in apphosting.prod.yaml must explicitly override the base apphosting.yaml stamp.');
  }

  for (const [key, entry] of Object.entries(merged)) {
    if (typeof entry.value !== 'string') continue;
    for (const rule of FORBIDDEN_PROD_SUBSTRINGS) {
      if (rule.pattern.test(entry.value)) {
        failures.push(
          `Effective prod variable "${key}" contains forbidden ${rule.label}: ${JSON.stringify(entry.value)}.`
        );
      }
    }
  }

  for (const secretName of REQUIRED_SECRET_BINDINGS) {
    const entry = merged[secretName];
    if (!entry || entry.secret !== secretName || typeof entry.value === 'string') {
      failures.push(
        `Secret "${secretName}" must be bound via Secret Manager ("secret: ${secretName}"), never as a literal value.`
      );
    }
  }

  return failures;
}

function checkSecurityRulesAndHygiene(rootDir: string, failures: string[], warnings: string[]) {
  const firestorePath = path.join(rootDir, 'firestore.rules');
  const storagePath = path.join(rootDir, 'storage.rules');

  if (!fs.existsSync(firestorePath)) {
    failures.push('Missing firestore.rules at repository root.');
  } else {
    const fsRules = fs.readFileSync(firestorePath, 'utf8');
    if (/@gmail\.com|@googlemail\.com|@hotmail\.com/i.test(fsRules)) {
      failures.push('firestore.rules still contains email-domain wildcard auth checks.');
    }
    if (!fsRules.includes('request.auth.token.isAdmin == true')) {
      failures.push('firestore.rules must gate system_logs and qa_suites on request.auth.token.isAdmin == true.');
    }
    if (!/match \/users\/\{userId\}[\s\S]*request\.auth != null && request\.auth\.uid == userId/.test(fsRules)) {
      failures.push('firestore.rules must guard users/{userId} writes with request.auth != null && request.auth.uid == userId.');
    }
  }

  if (!fs.existsSync(storagePath)) {
    failures.push('Missing storage.rules at repository root.');
  } else {
    const stRules = fs.readFileSync(storagePath, 'utf8');
    if (!stRules.includes("chamber != 'chronicles'")) {
      failures.push('storage.rules is missing Chamber II chronicles exclusion.');
    }
    if (!/match \/qa-evidence\/\{allPaths=\*\*\}[\s\S]*request\.auth\.token\.isAdmin == true/.test(stRules)) {
      failures.push('storage.rules must lock qa-evidence/** to request.auth.token.isAdmin == true.');
    }
  }

  for (const forbiddenFile of ['users.json', 'public/qa_checklist_interactive.html']) {
    if (fs.existsSync(path.join(rootDir, forbiddenFile))) {
      failures.push(`Forbidden sensitive/unauthenticated file still exists on disk: ${forbiddenFile}`);
    }
    if (fs.existsSync(path.join(rootDir, '.git'))) {
      try {
        const tracked = execSync(`git ls-files -- "${forbiddenFile}"`, { cwd: rootDir, encoding: 'utf8' }).trim();
        if (tracked) {
          failures.push(`Forbidden file is still tracked in Git index: ${tracked}`);
        }
      } catch {
        warnings.push(`Could not run git ls-files check for ${forbiddenFile}.`);
      }
    }
  }

  const tempDeleteDir = path.join(rootDir, 'src/app/api/temp-delete-user');
  if (fs.existsSync(tempDeleteDir)) {
    failures.push('Unauthenticated /api/temp-delete-user route still exists.');
  }

  const planePath = path.join(rootDir, 'scripts/plane.js');
  if (fs.existsSync(planePath)) {
    const planeSrc = fs.readFileSync(planePath, 'utf8');
    if (/plane_api_[0-9a-f]{8,}/i.test(planeSrc)) {
      failures.push('scripts/plane.js contains a hard-coded PLANE_API_KEY literal.');
    }
  }
}

export function runProdPreflightAudit(rootDir = process.cwd()): PreflightReport {
  const failures: string[] = [];
  const warnings: string[] = [];

  const basePath = path.join(rootDir, 'apphosting.yaml');
  const prodPath = path.join(rootDir, 'apphosting.prod.yaml');

  if (!fs.existsSync(basePath)) {
    failures.push('Missing apphosting.yaml');
    return { passed: false, failures, warnings, mergedVariables: {} };
  }
  if (!fs.existsSync(prodPath)) {
    failures.push('Missing apphosting.prod.yaml');
    return { passed: false, failures, warnings, mergedVariables: {} };
  }

  const baseEntries = parseAppHostingEnv(fs.readFileSync(basePath, 'utf8'));
  const prodEntries = parseAppHostingEnv(fs.readFileSync(prodPath, 'utf8'));
  const mergedVariables = mergeAppHostingConfigs(baseEntries, prodEntries);

  failures.push(...validateMergedProdConfig(baseEntries, prodEntries));
  checkSecurityRulesAndHygiene(rootDir, failures, warnings);

  // Assert exact active production Storage bucket (.firebasestorage.app, never non-existent .appspot.com)
  const bucket = mergedVariables['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET']?.value || '';
  if (bucket !== `${PRODUCTION_PROJECT_ID}.firebasestorage.app`) {
    failures.push(
      `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET must be "${PRODUCTION_PROJECT_ID}.firebasestorage.app" (got ${JSON.stringify(bucket)}).`
    );
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    mergedVariables,
  };
}

if (require.main === module) {
  console.log('🛡️ Running Production Cutover Preflight Audit (MW-407 / MW-408)...');
  const report = runProdPreflightAudit(process.cwd());

  console.log(`Checked ${Object.keys(report.mergedVariables).length} merged App Hosting production variables.`);
  for (const w of report.warnings) {
    console.warn(`⚠️  WARNING: ${w}`);
  }

  if (!report.passed) {
    console.error(`\n❌ PRODUCTION PREFLIGHT FAILED CLOSED (${report.failures.length} blocking issue(s)):`);
    for (const f of report.failures) {
      console.error(`   • ${f}`);
    }
    process.exit(1);
  }

  console.log('✅ PRODUCTION PREFLIGHT PASSED — zero dev/placeholder leaks, rules & hygiene verified.');
  process.exit(0);
}
