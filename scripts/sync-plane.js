const fs = require('fs');
const path = require('path');

const PLANE_API_KEY = process.env.PLANE_API_KEY || process.env.PLANE_API_TOKEN;
const PLANE_WORKSPACE_SLUG = process.env.PLANE_WORKSPACE_SLUG;
const PLANE_PROJECT_ID = process.env.PLANE_PROJECT_ID;

if (!PLANE_API_KEY || !PLANE_WORKSPACE_SLUG || !PLANE_PROJECT_ID) {
  console.error('Error: Please set PLANE_API_KEY/PLANE_API_TOKEN, PLANE_WORKSPACE_SLUG, and PLANE_PROJECT_ID environment variables.');
  process.exit(1);
}

const manifestPath = path.resolve(__dirname, '../docs/KNOWLEDGE_MANIFEST.md');

try {
  const content = fs.readFileSync(manifestPath, 'utf8');
  
  const backlogSection = content.split('## Master Project Backlog')[1] || '';
  const issueRegex = /-\s*`\[([ x/])\]`\s*\*\*\[(MW-\d+)\]\*\*\s*(.*)/g;
  
  const issues = [];
  let match;
  while ((match = issueRegex.exec(backlogSection)) !== null) {
    const statusChar = match[1];
    const key = match[2];
    const name = match[3].trim();
    
    let state = 'backlog';
    if (statusChar === 'x') state = 'done';
    if (statusChar === '/') state = 'started';

    issues.push({ key, name, state });
  }

  if (issues.length === 0) {
    console.log('No backlog items found to synchronize.');
    process.exit(0);
  }

  console.log(`Found ${issues.length} items to sync. Initializing transmission...`);

  async function syncIssues() {
    for (const issue of issues) {
      // Omit state to avoid UUID resolution errors
      const payload = {
        name: `[${issue.key}] ${issue.name}`,
        description_html: `<p>Migrated from living manifest tracking: ${issue.key}</p>`,
        priority: 'high'
      };

      let success = false;
      const domains = [
        `https://api.brij.plane.so/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`,
        `https://api.plane.so/api/v1/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`
      ];

      for (const url of domains) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': PLANE_API_KEY
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
          }

          const data = await response.json();
          console.log(`Successfully synced issue [${issue.key}] (ID: ${data.id})`);
          success = true;
          break; // Break the domain fallback loop on success
        } catch (err) {
          if (err.code === 'ENOTFOUND' || err.message.includes('ENOTFOUND') || err.message.includes('fetch failed')) {
            continue;
          }
          console.error(`Failed to sync issue [${issue.key}] on ${url}:`, err.message);
          break; // Break if it is a real API error
        }
      }

      if (!success) {
        console.error(`Failed to sync issue [${issue.key}] across all endpoints.`);
      }
    }
  }

  syncIssues();

} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
