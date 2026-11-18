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

export async function createPlaneIssue(
  cfg: PlaneConfig,
  title: string,
  descriptionText: string
): Promise<string> {
  const payload = JSON.stringify({
    name: title,
    description_html: `<p>${descriptionText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.plane.so',
        path: `/api/v1/workspaces/${cfg.workspaceSlug}/projects/${cfg.projectId}/issues/`,
        method: 'POST',
        headers: {
          'x-api-key': cfg.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && parsed.sequence_id) {
              resolve(`MW-${parsed.sequence_id}`);
            } else {
              reject(new Error(`Plane API ${res.statusCode}: ${body.slice(0, 200)}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
