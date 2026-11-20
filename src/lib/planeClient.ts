import https from 'https';
import fs from 'fs';
import path from 'path';
import {
  normalisePlaneIssueKey,
  stripHtmlToSafeText,
  textToPlaneHtml,
  type PlaneCommentItem,
  type PlaneIssueDetail,
  type PlaneStateOption,
} from './planeTypes';

if (typeof window !== 'undefined' && !process.env.VITEST) {
  throw new Error('src/lib/planeClient.ts is server-only and must never be imported in a browser bundle.');
}

export interface PlaneConfig {
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
}

export interface LoadPlaneEnvOptions {
  /** Whether to fall back to reading .env.local from disk (disabled automatically on Cloud Run and Vitest). */
  allowDotEnvLocal?: boolean;
  /** Explicitly opt-in during unit tests; defaults to false so Vitest never fires live Plane API writes. */
  allowInTest?: boolean;
}

const DEFAULT_WORKSPACE_SLUG = 'memory-weaver-studio';
const DEFAULT_PROJECT_ID = 'ef45f4c8-ea7e-490d-8282-e959e484ae07';
const PLANE_SOCKET_TIMEOUT_MS = 6000;
const STATES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedStatesEntry {
  fetchedAt: number;
  states: PlaneStateOption[];
}

const statesCache = new Map<string, CachedStatesEntry>();

export function clearPlaneStatesCache(): void {
  statesCache.clear();
}

export function loadPlaneEnv(options: LoadPlaneEnvOptions = {}): PlaneConfig | null {
  if (process.env.VITEST && !options.allowInTest) {
    return null;
  }

  const isCloudRun = Boolean(process.env.K_SERVICE);
  const canReadDotEnv =
    options.allowDotEnvLocal !== false && !isCloudRun && !process.env.VITEST;

  let dotEnvContent: string | null = null;
  const readFromDotEnv = (key: string): string => {
    if (!canReadDotEnv) return '';
    if (dotEnvContent === null) {
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        dotEnvContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      } catch {
        dotEnvContent = '';
      }
    }
    if (!dotEnvContent) return '';
    const match = dotEnvContent.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const readKey = (key: string): string => {
    const fromEnv = (process.env[key] || '').trim();
    if (fromEnv) return fromEnv;
    return readFromDotEnv(key);
  };

  const apiKey = readKey('PLANE_API_KEY');
  if (!apiKey) return null;

  const workspaceSlug = readKey('PLANE_WORKSPACE_SLUG') || DEFAULT_WORKSPACE_SLUG;
  const projectId = readKey('PLANE_PROJECT_ID') || DEFAULT_PROJECT_ID;

  return { apiKey, workspaceSlug, projectId };
}

/**
 * Executes a Plane.so REST API request using Node's native `https` module
 * with a strict 6000ms socket timeout (Rule 4 compliant on Windows + Node.js Cloud Run).
 */
export function planeHttpsRequest(
  cfg: PlaneConfig,
  method: 'GET' | 'POST' | 'PATCH',
  apiPath: string,
  bodyObj?: Record<string, unknown>,
  timeoutMs: number = PLANE_SOCKET_TIMEOUT_MS
): Promise<{ status: number; data: any }> {
  const payload = bodyObj ? JSON.stringify(bodyObj) : null;
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const req = https.request(
      {
        hostname: 'api.plane.so',
        path: apiPath,
        method,
        headers: {
          'x-api-key': cfg.apiKey,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          finish(() => {
            try {
              const parsed = JSON.parse(body);
              resolve({ status: res.statusCode || 0, data: parsed });
            } catch {
              resolve({ status: res.statusCode || 0, data: body });
            }
          });
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Plane API request timed out after ${timeoutMs}ms (${method} ${apiPath})`));
    });

    req.on('error', (err) => {
      finish(() => reject(err));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

export async function listPlaneStates(
  cfg: PlaneConfig,
  opts?: { bypassCache?: boolean; ttlMs?: number }
): Promise<PlaneStateOption[]> {
  const cacheKey = `${cfg.workspaceSlug}:${cfg.projectId}`;
  const ttlMs = typeof opts?.ttlMs === 'number' ? opts.ttlMs : STATES_CACHE_TTL_MS;
  const cached = statesCache.get(cacheKey);
  if (!opts?.bypassCache && cached && Date.now() - cached.fetchedAt < ttlMs) {
    return cached.states;
  }

  const res = await planeHttpsRequest(
    cfg,
    'GET',
    `/api/v1/workspaces/${encodeURIComponent(cfg.workspaceSlug)}/projects/${encodeURIComponent(cfg.projectId)}/states/`
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Plane states API ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
  }

  const rawList: any[] = Array.isArray(res.data) ? res.data : res.data?.results || [];
  const states: PlaneStateOption[] = rawList
    .filter((s) => s && typeof s.id === 'string')
    .map((s) => ({
      id: String(s.id),
      name: String(s.name || 'Unknown'),
      group: String(s.group || 'backlog'),
      color: s.color ? String(s.color) : null,
    }));

  statesCache.set(cacheKey, { fetchedAt: Date.now(), states });
  return states;
}

async function fetchWorkItemRawByKey(cfg: PlaneConfig, issueKey: string): Promise<any> {
  const normalisedKey = normalisePlaneIssueKey(issueKey);
  if (!normalisedKey) {
    throw new Error(`Invalid Plane issue key "${issueKey}". Expected format MW-123.`);
  }

  const res = await planeHttpsRequest(
    cfg,
    'GET',
    `/api/v1/workspaces/${encodeURIComponent(cfg.workspaceSlug)}/work-items/${encodeURIComponent(normalisedKey)}/`
  );

  if (res.status === 404) {
    throw new Error(`Plane issue ${normalisedKey} not found.`);
  }
  if (res.status < 200 || res.status >= 300 || !res.data?.id) {
    throw new Error(`Plane work-item API ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
  }

  // Cross-project boundary check
  if (res.data.project && String(res.data.project) !== cfg.projectId) {
    throw new Error(
      `Plane issue ${normalisedKey} belongs to another project (${res.data.project}) and cannot be accessed.`
    );
  }

  return res.data;
}

export async function listPlaneIssueComments(
  cfg: PlaneConfig,
  issueUuid: string
): Promise<PlaneCommentItem[]> {
  const res = await planeHttpsRequest(
    cfg,
    'GET',
    `/api/v1/workspaces/${encodeURIComponent(cfg.workspaceSlug)}/projects/${encodeURIComponent(cfg.projectId)}/issues/${encodeURIComponent(issueUuid)}/comments/`
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Plane comments API ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
  }

  const rawList: any[] = Array.isArray(res.data) ? res.data : res.data?.results || [];
  return rawList.map((c) => {
    const stripped = typeof c?.comment_stripped === 'string' && c.comment_stripped.trim()
      ? c.comment_stripped.trim()
      : stripHtmlToSafeText(c?.comment_html);
    const actor =
      c?.actor_detail?.display_name ||
      c?.actor_detail?.email ||
      (typeof c?.created_by === 'string' ? c.created_by : null);
    return {
      id: String(c?.id || ''),
      bodyText: stripped,
      createdAt: c?.created_at ? String(c.created_at) : null,
      updatedAt: c?.updated_at ? String(c.updated_at) : null,
      actor: actor ? String(actor) : null,
    };
  });
}

export async function getPlaneIssueWithComments(
  cfg: PlaneConfig,
  issueKey: string
): Promise<{
  issue: PlaneIssueDetail;
  comments: PlaneCommentItem[];
  states: PlaneStateOption[];
}> {
  const [rawIssue, states] = await Promise.all([
    fetchWorkItemRawByKey(cfg, issueKey),
    listPlaneStates(cfg),
  ]);

  const comments = await listPlaneIssueComments(cfg, String(rawIssue.id)).catch(() => []);
  const matchedState = states.find((s) => s.id === String(rawIssue.state));
  const descriptionText =
    typeof rawIssue.description_stripped === 'string' && rawIssue.description_stripped.trim()
      ? rawIssue.description_stripped.trim()
      : stripHtmlToSafeText(rawIssue.description_html);

  const sequenceId = Number(rawIssue.sequence_id) || 0;
  const issue: PlaneIssueDetail = {
    id: String(rawIssue.id),
    key: sequenceId > 0 ? `MW-${sequenceId}` : normalisePlaneIssueKey(issueKey) || issueKey,
    sequenceId,
    projectId: String(rawIssue.project || cfg.projectId),
    name: String(rawIssue.name || ''),
    descriptionText,
    priority: String(rawIssue.priority || 'none'),
    stateId: String(rawIssue.state || ''),
    stateName: matchedState?.name || String(rawIssue.state_group || 'Unknown'),
    stateGroup: matchedState?.group || String(rawIssue.state_group || 'backlog'),
    stateColor: matchedState?.color || null,
    createdAt: rawIssue.created_at ? String(rawIssue.created_at) : null,
    updatedAt: rawIssue.updated_at ? String(rawIssue.updated_at) : null,
  };

  return { issue, comments, states };
}

export async function createPlaneIssue(
  cfg: PlaneConfig,
  title: string,
  descriptionText: string
): Promise<string> {
  const res = await planeHttpsRequest(
    cfg,
    'POST',
    `/api/v1/workspaces/${encodeURIComponent(cfg.workspaceSlug)}/projects/${encodeURIComponent(cfg.projectId)}/issues/`,
    {
      name: title,
      description_html: textToPlaneHtml(descriptionText),
    }
  );

  if (res.status >= 200 && res.status < 300 && res.data?.sequence_id) {
    return `MW-${res.data.sequence_id}`;
  }
  throw new Error(`Plane API ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
}

export async function addPlaneIssueComment(
  cfg: PlaneConfig,
  issueIdentifier: string,
  commentText: string
): Promise<PlaneCommentItem> {
  const cleanText = String(commentText || '').trim();
  if (!cleanText) {
    throw new Error('Comment text cannot be empty.');
  }

  let issueUuid = issueIdentifier.trim();
  if (normalisePlaneIssueKey(issueUuid)) {
    const raw = await fetchWorkItemRawByKey(cfg, issueUuid);
    issueUuid = String(raw.id);
  }

  const res = await planeHttpsRequest(
    cfg,
    'POST',
    `/api/v1/workspaces/${encodeURIComponent(cfg.workspaceSlug)}/projects/${encodeURIComponent(cfg.projectId)}/issues/${encodeURIComponent(issueUuid)}/comments/`,
    {
      comment_html: textToPlaneHtml(cleanText),
    }
  );

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Plane comment POST ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
  }

  return {
    id: String(res.data?.id || ''),
    bodyText:
      typeof res.data?.comment_stripped === 'string' && res.data.comment_stripped.trim()
        ? res.data.comment_stripped.trim()
        : cleanText,
    createdAt: res.data?.created_at ? String(res.data.created_at) : new Date().toISOString(),
    updatedAt: res.data?.updated_at ? String(res.data.updated_at) : new Date().toISOString(),
    actor: null,
  };
}

export async function updatePlaneIssueState(
  cfg: PlaneConfig,
  issueIdentifier: string,
  targetState: string = 'done'
): Promise<{ issueId: string; sequenceId?: number; stateId: string; stateName?: string }> {
  const states = await listPlaneStates(cfg);

  const desired = targetState.trim().toLowerCase();
  const matchedState = states.find(
    (s) =>
      s.id.toLowerCase() === desired ||
      s.name.toLowerCase() === desired ||
      s.group.toLowerCase() === desired ||
      (desired === 'done' && s.group.toLowerCase() === 'completed')
  );

  const targetStateId = matchedState?.id || targetState.trim();

  let targetIssueId = issueIdentifier.trim();
  let sequenceId: number | undefined;
  const normalisedKey = normalisePlaneIssueKey(targetIssueId);
  if (normalisedKey) {
    // O(1) lookup via /work-items/{MW-xxx}/ (bypasses 100-item page-1 blind spot)
    const rawIssue = await fetchWorkItemRawByKey(cfg, normalisedKey);
    targetIssueId = String(rawIssue.id);
    sequenceId = Number(rawIssue.sequence_id) || undefined;
  }

  const patchRes = await planeHttpsRequest(
    cfg,
    'PATCH',
    `/api/v1/workspaces/${encodeURIComponent(cfg.workspaceSlug)}/projects/${encodeURIComponent(cfg.projectId)}/issues/${encodeURIComponent(targetIssueId)}/`,
    { state: targetStateId }
  );
  if (patchRes.status < 200 || patchRes.status >= 300) {
    throw new Error(`Plane PATCH ${patchRes.status}: ${JSON.stringify(patchRes.data).slice(0, 200)}`);
  }

  return {
    issueId: targetIssueId,
    sequenceId,
    stateId: targetStateId,
    stateName: matchedState?.name,
  };
}
