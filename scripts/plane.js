/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Try reading .env.local for PLANE credentials
let PLANE_API_KEY = process.env.PLANE_API_KEY || 'plane_api_0522384011a2489f8d95713b1f811043';
let PLANE_WORKSPACE_SLUG = process.env.PLANE_WORKSPACE_SLUG || 'memory-weaver-studio';
let PLANE_PROJECT_ID = process.env.PLANE_PROJECT_ID || 'ef45f4c8-ea7e-490d-8282-e959e484ae07'; // Core Engine (MW)

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const keyMatch = envContent.match(/PLANE_API_KEY=(.+)/);
  if (keyMatch) PLANE_API_KEY = keyMatch[1].trim();
  const slugMatch = envContent.match(/PLANE_WORKSPACE_SLUG=(.+)/);
  if (slugMatch) PLANE_WORKSPACE_SLUG = slugMatch[1].trim();
  const projMatch = envContent.match(/PLANE_PROJECT_ID=(.+)/);
  if (projMatch) PLANE_PROJECT_ID = projMatch[1].trim();
}

const PLANE_HOST = 'api.plane.so';

function request(method, apiPath, bodyData) {
  return new Promise((resolve, reject) => {
    const payload = bodyData ? JSON.stringify(bodyData) : null;
    const options = {
      hostname: PLANE_HOST,
      path: apiPath,
      method: method,
      headers: {
        'x-api-key': PLANE_API_KEY,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  if (command === 'list') {
    const res = await request('GET', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`);
    console.log(JSON.stringify(res.data, null, 2));
  } else if (command === 'states') {
    const res = await request('GET', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/states/`);
    console.log(JSON.stringify(res.data, null, 2));
  } else if (command === 'create') {
    const title = args[1];
    const desc = args[2] || '';
    if (!title) {
      console.error('Usage: node scripts/plane.js create "Issue Title" "Description"');
      process.exit(1);
    }
    const res = await request('POST', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`, {
      name: title,
      description_html: `<p>${desc}</p>`
    });
    console.log(JSON.stringify(res.data, null, 2));
  } else if (command === 'update' || command === 'close') {
    const issueIdentifier = args[1];
    let stateInput = args[2] || 'done';

    if (!issueIdentifier) {
      console.error('Usage: node scripts/plane.js update <issueIdOrSeq> [stateNameOrId]');
      process.exit(1);
    }

    // Fetch states to resolve stateId if a name like "done" or "in_progress" was given
    const statesRes = await request('GET', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/states/`);
    const states = Array.isArray(statesRes.data) ? statesRes.data : (statesRes.data?.results || []);
    
    let targetStateId = stateInput;
    if (states.length > 0) {
      const match = states.find(s => 
        s.id === stateInput || 
        s.name.toLowerCase() === stateInput.toLowerCase() ||
        s.group?.toLowerCase() === stateInput.toLowerCase()
      );
      if (match) {
        targetStateId = match.id;
      }
    }

    // Fetch issues to resolve sequence_id (e.g. 53 or MW-53) to issue UUID if needed
    let targetIssueId = issueIdentifier;
    if (!issueIdentifier.includes('-') && issueIdentifier.length < 20) {
      const issuesRes = await request('GET', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`);
      const issues = Array.isArray(issuesRes.data) ? issuesRes.data : (issuesRes.data?.results || []);
      const seqNum = parseInt(issueIdentifier.replace(/\D/g, ''), 10);
      const matchedIssue = issues.find(i => i.sequence_id === seqNum);
      if (matchedIssue) {
        targetIssueId = matchedIssue.id;
      }
    }

    const patchPayload = { state: targetStateId };
    const res = await request('PATCH', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/${targetIssueId}/`, patchPayload);
    console.log(JSON.stringify(res.data, null, 2));
  } else if (command === 'describe' || command === 'set-desc') {
    const issueIdentifier = args[1];
    const desc = args[2] || '';

    if (!issueIdentifier || !desc) {
      console.error('Usage: node scripts/plane.js describe <issueIdOrSeq> "Description Text"');
      process.exit(1);
    }

    let targetIssueId = issueIdentifier;
    if (!issueIdentifier.includes('-') || issueIdentifier.length < 20) {
      const issuesRes = await request('GET', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`);
      const issues = Array.isArray(issuesRes.data) ? issuesRes.data : (issuesRes.data?.results || []);
      const seqNum = parseInt(issueIdentifier.replace(/\D/g, ''), 10);
      const matchedIssue = issues.find(i => i.sequence_id === seqNum);
      if (matchedIssue) {
        targetIssueId = matchedIssue.id;
      }
    }

    const patchPayload = { description_html: desc.startsWith('<') ? desc : `<p>${desc}</p>` };
    const res = await request('PATCH', `/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/${targetIssueId}/`, patchPayload);
    console.log(JSON.stringify(res.data, null, 2));
  } else {
    console.log('Unknown command:', command);
  }
}

main().catch(err => {
  console.error('Plane CLI Error:', err);
  process.exit(1);
});
