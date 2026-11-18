import https from 'https';
import fs from 'fs';
import path from 'path';

export interface PlaneConfig {
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
}

export function loadPlaneEnv(): PlaneConfig | null {
  const readKey = (k: string): string => {
    if (process.env[k]) return process.env[k]!;
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return '';
    const match = fs.readFileSync(envPath, 'utf8').match(new RegExp(`^${k}\\s*=\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
  };

  const apiKey = readKey('PLANE_API_KEY');
  const workspaceSlug = readKey('PLANE_WORKSPACE_SLUG') || 'memory-weaver-studio';
  const projectId = readKey('PLANE_PROJECT_ID') || 'ef45f4c8-ea7e-490d-8282-e959e484ae07';
  if (!apiKey) return null;
  return { apiKey, workspaceSlug, projectId };
}

function planeHttpsRequest(
  cfg: PlaneConfig,
  method: 'GET' | 'POST' | 'PATCH',
  apiPath: string,
  bodyObj?: Record<string, unknown>
): Promise<{ status: number; data: any }> {
  const payload = bodyObj ? JSON.stringify(bodyObj) : null;
  return new Promise((resolve, reject) => {
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
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode || 0, data: parsed });
          } catch {
            resolve({ status: res.statusCode || 0, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function createPlaneIssue(
  cfg: PlaneConfig,
  title: string,
  descriptionText: string
): Promise<string> {
  const res = await planeHttpsRequest(
    cfg,
    'POST',
    `/api/v1/workspaces/${cfg.workspaceSlug}/projects/${cfg.projectId}/issues/`,
    {
      name: title,
      description_html: `<p>${descriptionText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`,
    }
  );

  if (res.status >= 200 && res.status < 300 && res.data?.sequence_id) {
    return `MW-${res.data.sequence_id}`;
  }
  throw new Error(`Plane API ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
}

export async function updatePlaneIssueState(
  cfg: PlaneConfig,
  issueIdentifier: string,
  targetState: string = 'done'
): Promise<{ issueId: string; sequenceId?: number; stateId: string }> {
  const statesRes = await planeHttpsRequest(
    cfg,
    'GET',
    `/api/v1/workspaces/${cfg.workspaceSlug}/projects/${cfg.projectId}/states/`
  );
  const states: any[] = Array.isArray(statesRes.data)
    ? statesRes.data
    : statesRes.data?.results || [];

  const desired = targetState.trim().toLowerCase();
  const matchedState = states.find(
    (s) =>
      String(s.id || '').toLowerCase() === desired ||
      String(s.name || '').toLowerCase() === desired ||
      String(s.group || '').toLowerCase() === desired ||
      (desired === 'done' && String(s.group || '').toLowerCase() === 'completed')
  );

  const targetStateId = matchedState?.id || targetState;

  let targetIssueId = issueIdentifier.trim();
  let sequenceId: number | undefined;
  const seqMatch = targetIssueId.match(/^(?:MW-)?(\d+)$/i);
  if (seqMatch) {
    sequenceId = parseInt(seqMatch[1], 10);
    const issuesRes = await planeHttpsRequest(
      cfg,
      'GET',
      `/api/v1/workspaces/${cfg.workspaceSlug}/projects/${cfg.projectId}/issues/`
    );
    const issues: any[] = Array.isArray(issuesRes.data)
      ? issuesRes.data
      : issuesRes.data?.results || [];
    const matchedIssue = issues.find((i) => i.sequence_id === sequenceId);
    if (!matchedIssue?.id) {
      throw new Error(`Plane issue ${issueIdentifier} not found in project ${cfg.projectId}`);
    }
    targetIssueId = matchedIssue.id;
  }

  const patchRes = await planeHttpsRequest(
    cfg,
    'PATCH',
    `/api/v1/workspaces/${cfg.workspaceSlug}/projects/${cfg.projectId}/issues/${targetIssueId}/`,
    { state: targetStateId }
  );
  if (patchRes.status < 200 || patchRes.status >= 300) {
    throw new Error(`Plane PATCH ${patchRes.status}: ${JSON.stringify(patchRes.data).slice(0, 200)}`);
  }

  return { issueId: targetIssueId, sequenceId, stateId: targetStateId };
}
