/**
 * 🛡️ Pre-Deployment Staging Data Integrity Diagnostic Audit (TOOL-MW-145)
 *
 * Scans the staging Firestore database (memory-weaver-dev) for:
 * - Audit A: Orphan Documents (Missing both sceneId and promptId)
 * - Audit B: Split-Brain Claimants (Multiple documents claiming the same sceneId)
 * - Audit C: Orphan Video Assets (Video URL / takes present but empty status or zero schema metadata)
 * - Audit D: Identity Bleed / Title Mismatches (Document title belongs to Scene Y while sceneId points to Scene X)
 *
 * Exit code 0 on clean pass; Exit code 1 if any integrity anomaly is detected.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { MASTER_STORY_STRUCTURE } from '../src/lib/curriculum/masterStoryStructure';

interface DecodedMemory {
  id: string;
  sceneId?: string;
  promptId?: string;
  title?: string;
  prose?: string;
  description?: string;
  videoUrl?: string;
  takes?: any[];
  status?: string;
  productionStage?: number;
  actsCompleted?: string[];
  isTestFixture?: boolean;
  isFlightSimulator?: boolean;
}

interface AuditAnomaly {
  audit: 'A' | 'B' | 'C' | 'D';
  severity: 'CRITICAL' | 'WARNING';
  docId: string;
  sceneId?: string;
  description: string;
}

function decodeFirestoreField(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeFirestoreField);
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = decodeFirestoreField(v);
    }
    return res;
  }
  return null;
}

function getAccessToken(): string {
  if (process.env.GCLOUD_TOKEN) return process.env.GCLOUD_TOKEN;

  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (fs.existsSync(configPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed.tokens?.access_token) {
        return parsed.tokens.access_token;
      }
    } catch (e) {
      console.warn('[auditStagingDataIntegrity] Failed to read firebase-tools.json:', e);
    }
  }

  throw new Error('No Google OAuth access token found. Run `firebase login` or set GCLOUD_TOKEN.');
}

function httpsGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 500, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

export const KNOWN_STAGING_PERSONAS = [
  { uid: 'TQdB395kXxaAGPhFxk1LVWuT8cg2', email: 'nareshmepani@hotmail.com', role: 'Primary Producer & QA Lead' },
  { uid: 'fPd7cERQ5dNdmqnAD1CodwbXJHl1', email: 'nareshmepani@googlemail.com', role: 'Secondary Admin Persona' },
  { uid: 'xo8Y3wtDHLaNTDZI630jWrpu7gk2', email: 'test@example.com', role: 'Automated E2E Test Runner' },
  { uid: '6D1xU4cY3OWmpv955wtZHdH8dQf2', email: 'nareshmepani+legal&gdpr@hotmail.com', role: 'Legal & GDPR Persona' },
  { uid: 'BM8RgcxxUMPRdENLgvbjddqMidT2', email: 'nareshmepani@yahoo.com', role: 'Standard Storyteller Persona' },
  { uid: 'dlku0xrbcZXqbxuo02l2JOi8TXI2', email: 'nareshmepani+2026-08-21@hotmail.com', role: 'Clean-Slate Persona' },
];

export async function runStagingDataAudit(targetUid = 'TQdB395kXxaAGPhFxk1LVWuT8cg2', projectId = 'memory-weaver-dev'): Promise<AuditAnomaly[]> {
  const token = getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${targetUid}/memories`;

  console.log(`\n🔍 Connecting to Firestore [${projectId}] for UID: ${targetUid}...`);
  const response = await httpsGet(url, {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  });

  if (response.status === 404) {
    console.log(`📦 Retrieved 0 raw memory documents (clean slate).`);
    return [];
  }

  if (response.status !== 200) {
    throw new Error(`Firestore REST query failed with status ${response.status}: ${response.body}`);
  }

  const rawData = JSON.parse(response.body);
  const rawDocs: any[] = rawData.documents || [];
  console.log(`📦 Retrieved ${rawDocs.length} raw memory documents.`);

  // Decode documents
  const memories: DecodedMemory[] = rawDocs.map(d => {
    const docId = d.name.split('/').pop() || '';
    const fields = d.fields || {};
    const decoded: DecodedMemory = { id: docId };

    for (const [k, v] of Object.entries(fields)) {
      (decoded as any)[k] = decodeFirestoreField(v);
    }

    return decoded;
  });

  const anomalies: AuditAnomaly[] = [];

  // Build curriculum lookup maps
  const allCurriculumScenes = MASTER_STORY_STRUCTURE.flatMap(part => part.scenes);
  const sceneByIdMap = new Map(allCurriculumScenes.map(s => [s.id, s]));
  const sceneByPromptIdMap = new Map(allCurriculumScenes.map(s => [s.promptId, s]));
  const sceneByTitleMap = new Map(allCurriculumScenes.map(s => [s.title.toLowerCase().trim(), s]));

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT A: ORPHAN SEARCH (Missing both sceneId and promptId)
  // ─────────────────────────────────────────────────────────────────────────────
  memories.forEach(m => {
    if (m.isFlightSimulator || m.id === 'first_flight_rehearsal') return;

    const hasSceneId = typeof m.sceneId === 'string' && m.sceneId.trim().length > 0;
    const hasPromptId = typeof m.promptId === 'string' && m.promptId.trim().length > 0;
    const idIsCanonical = sceneByIdMap.has(m.id) || sceneByPromptIdMap.has(m.id);

    if (!hasSceneId && !hasPromptId && !idIsCanonical) {
      anomalies.push({
        audit: 'A',
        severity: 'CRITICAL',
        docId: m.id,
        description: `Orphan document missing both canonical sceneId and promptId (title: "${m.title || 'untitled'}").`,
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT B: SPLIT-BRAIN SEARCH (Duplicate documents claiming the exact same sceneId)
  // ─────────────────────────────────────────────────────────────────────────────
  const sceneIdCounts = new Map<string, string[]>();
  memories.forEach(m => {
    if (m.isTestFixture || m.isFlightSimulator || m.id.includes('test')) return;
    const effectiveSceneId = m.sceneId || (sceneByPromptIdMap.get(m.promptId || '')?.id) || (sceneByIdMap.has(m.id) ? m.id : undefined);
    if (!effectiveSceneId) return;

    const list = sceneIdCounts.get(effectiveSceneId) || [];
    list.push(m.id);
    sceneIdCounts.set(effectiveSceneId, list);
  });

  sceneIdCounts.forEach((docIds, sceneId) => {
    if (docIds.length > 1) {
      anomalies.push({
        audit: 'B',
        severity: 'CRITICAL',
        docId: docIds.join(', '),
        sceneId,
        description: `Split-brain collision: ${docIds.length} documents claim the same sceneId "${sceneId}": [${docIds.join(', ')}].`,
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT C: ORPHAN VIDEO TAKES (Persistent cloud video asset present but draft status)
  // ─────────────────────────────────────────────────────────────────────────────
  memories.forEach(m => {
    const isCloudMedia = (url?: string) => typeof url === 'string' && url.startsWith('http') && !url.startsWith('blob:');

    const hasCloudVideo = isCloudMedia(m.videoUrl) ||
      (Array.isArray(m.takes) && m.takes.some((t: any) => isCloudMedia(t.videoUrl) || (t.mediaMode === 'video' && isCloudMedia(t.url))));

    if (hasCloudVideo) {
      if (!m.status || m.status === 'draft') {
        anomalies.push({
          audit: 'C',
          severity: 'CRITICAL',
          docId: m.id,
          sceneId: m.sceneId,
          description: `Orphan cloud video asset detected: Document contains recorded cloud video but status is '${m.status || 'undefined'}' (must be 'captured', 'pre-release', or 'published').`,
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIT D: IDENTITY BLEED / TITLE MISMATCH (Title belonging to Scene Y with sceneId of Scene X)
  // ─────────────────────────────────────────────────────────────────────────────
  memories.forEach(m => {
    if (!m.title || !m.sceneId) return;

    const matchedSceneByTitle = sceneByTitleMap.get(m.title.toLowerCase().trim());
    if (matchedSceneByTitle && matchedSceneByTitle.id !== m.sceneId) {
      anomalies.push({
        audit: 'D',
        severity: 'CRITICAL',
        docId: m.id,
        sceneId: m.sceneId,
        description: `Identity Bleed detected: Document title "${m.title}" belongs to scene "${matchedSceneByTitle.id}", but document sceneId is set to "${m.sceneId}"!`,
      });
    }
  });

  return anomalies;
}

export async function runMultiPersonaStagingAudit(projectId = 'memory-weaver-dev'): Promise<{ totalAnomalies: number; personaReports: any[] }> {
  console.log(`\n🌐 Initiating Global Staging Multi-Persona Audit across ${KNOWN_STAGING_PERSONAS.length} test accounts...\n`);

  const personaReports: any[] = [];
  let totalAnomalies = 0;

  for (const persona of KNOWN_STAGING_PERSONAS) {
    try {
      console.log(`👤 Checking Persona: ${persona.email} (${persona.role}) [UID: ${persona.uid}]`);
      const anomalies = await runStagingDataAudit(persona.uid, projectId);
      totalAnomalies += anomalies.length;
      personaReports.push({
        persona,
        anomalies,
        status: anomalies.length === 0 ? 'PASS' : 'FAIL',
      });
    } catch (err: any) {
      console.error(`⚠️ Error auditing persona ${persona.email}:`, err.message);
      personaReports.push({
        persona,
        anomalies: [{ audit: 'A', severity: 'CRITICAL', docId: 'ERROR', description: err.message }],
        status: 'ERROR',
      });
      totalAnomalies += 1;
    }
  }

  return { totalAnomalies, personaReports };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('🛡️  STAGING DATA INTEGRITY SHIELD (TOOL-MW-145 / RFC-MW-144)');
  console.log('═══════════════════════════════════════════════════════════════════════════');

  try {
    const isMultiPersona = process.argv.includes('--all-active') || process.argv.includes('--all');
    const customUidArgIdx = process.argv.indexOf('--uid');
    const customUid = customUidArgIdx !== -1 && process.argv[customUidArgIdx + 1] ? process.argv[customUidArgIdx + 1] : undefined;
    const targetUid = customUid || process.env.AUDIT_UID || 'TQdB395kXxaAGPhFxk1LVWuT8cg2';
    const projectId = process.env.AUDIT_PROJECT || 'memory-weaver-dev';

    if (isMultiPersona) {
      console.log('Mode: Mode B (Global Staging Scan: All Active Personas)');
      const { totalAnomalies, personaReports } = await runMultiPersonaStagingAudit(projectId);

      console.log('\n───────────────────────────────────────────────────────────────────────────');
      console.log('📊 MULTI-PERSONA AUDIT SUMMARY REPORT');
      console.log('───────────────────────────────────────────────────────────────────────────');

      personaReports.forEach(r => {
        const icon = r.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} [${r.status}] ${r.persona.email.padEnd(38)} (${r.persona.role}): ${r.anomalies.length} anomalies`);
        if (r.anomalies.length > 0) {
          r.anomalies.forEach((a: any) => console.log(`     └─ Audit ${a.audit} [${a.severity}]: ${a.description}`));
        }
      });

      console.log('───────────────────────────────────────────────────────────────────────────');
      if (totalAnomalies === 0) {
        console.log(`✅ ZERO ANOMALIES DETECTED ACROSS ALL ${personaReports.length} STAGING PERSONAS!`);
        console.log('🎉 Staging database verified 100% healthy and free from data corruption.');
        console.log('═══════════════════════════════════════════════════════════════════════════\n');
        process.exit(0);
      } else {
        console.error(`\n❌ ${totalAnomalies} TOTAL ANOMALIES DETECTED ACROSS STAGING PERSONAS.`);
        console.error('🚫 DEPLOYMENT / AUDIT GATE FAILED: Staging data contains anomalies.');
        console.error('═══════════════════════════════════════════════════════════════════════════\n');
        process.exit(1);
      }
    } else {
      console.log('Mode: Mode A (Target QA Persona)');
      const anomalies = await runStagingDataAudit(targetUid, projectId);

      console.log('\n───────────────────────────────────────────────────────────────────────────');
      console.log('📊 AUDIT SUMMARY REPORT');
      console.log('───────────────────────────────────────────────────────────────────────────');

      if (anomalies.length === 0) {
        console.log('✅ ZERO ANOMALIES DETECTED!');
        console.log('   ✓ Audit A: Zero orphan documents');
        console.log('   ✓ Audit B: Zero split-brain collisions');
        console.log('   ✓ Audit C: Zero unlinked or draft video assets');
        console.log('   ✓ Audit D: Zero title-scene identity bleeds');
        console.log('🎉 Staging database verified 100% healthy and aligned with canonical curriculum.');
        console.log('═══════════════════════════════════════════════════════════════════════════\n');
        process.exit(0);
      } else {
        console.error(`❌ ${anomalies.length} INTEGRITY ANOMALIES DETECTED:\n`);
        anomalies.forEach((a, idx) => {
          console.error(`[${idx + 1}] Audit ${a.audit} [${a.severity}]: ${a.description}`);
          console.error(`    Doc ID: ${a.docId} | Scene: ${a.sceneId || 'N/A'}`);
        });
        console.error('\n🚫 DEPLOYMENT / AUDIT GATE FAILED: Staging data contains anomalies.');
        console.error('═══════════════════════════════════════════════════════════════════════════\n');
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error('\n💥 FATAL ERROR EXECUTING DATA INTEGRITY AUDIT:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
