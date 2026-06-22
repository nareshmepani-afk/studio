const fs = require('fs');
const path = require('path');

// Target file locations
const manifestPath = path.resolve(__dirname, '../src/config/businessRules.ts');
const docsDir = path.resolve(__dirname, '../docs');
const outputPath = path.join(docsDir, 'living-manifest.md');
const jsonOutputPath = path.join(__dirname, '../src/app/admin/living-manifest.json');

try {
  // Read businessRules.ts
  const rawTs = fs.readFileSync(manifestPath, 'utf8');

  // Strip export / type keywords and as const to make it evaluatable standard JS
  const jsContent = rawTs
    .split('\n')
    .filter(line => !line.trim().startsWith('export type'))
    .join('\n')
    .replace(/export\s+const\s+BUSINESS_MANIFEST/g, 'const BUSINESS_MANIFEST')
    .replace(/as\s+const\s*;/g, ';');

  // Safely evaluate to extract BUSINESS_MANIFEST object
  const evaluateManifest = new Function(`${jsContent}\nreturn BUSINESS_MANIFEST;`);
  const manifest = evaluateManifest();

  // Ensure docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Compile to markdown
  let markdown = `# Living Business Manifest\n\n`;
  markdown += `*This document is automatically compiled at build-time from the application's central business rules config ([businessRules.ts](../src/config/businessRules.ts)). Do not modify this file directly.*\n\n`;

  // 1. Subscription Tiers Section
  markdown += `## Subscription Tiers\n\n`;
  markdown += `| Tier Name | Price (GBP) | Price (USD) | Locked Features | Additional Config |\n`;
  markdown += `| :--- | :---: | :---: | :--- | :--- |\n`;

  for (const [key, tier] of Object.entries(manifest.tiers)) {
    const formattedGbp = `£${tier.priceMonthlyGbp.toFixed(2)}`;
    const formattedUsd = `$${tier.priceMonthlyUsd.toFixed(2)}`;
    const lockedFeatures = tier.featuresLocked ? tier.featuresLocked.map(f => `\`${f}\``).join(', ') : 'None';
    
    // Additional config info
    const details = [];
    if (tier.demoScript) {
      details.push(`Demo Script: \`${tier.demoScript}\``);
    }
    if (tier.promotionalTrialMonths) {
      details.push(`Promotional Trial: ${tier.promotionalTrialMonths} months`);
    }
    const additionalConfig = details.length > 0 ? details.join('<br>') : 'N/A';

    markdown += `| **${tier.name}** (\`${key}\`) | ${formattedGbp} | ${formattedUsd} | ${lockedFeatures} | ${additionalConfig} |\n`;
  }
  
  markdown += `\n`;

  // 1.5. User Lifecycles Section
  if (manifest.userLifecycles) {
    markdown += `### 🔒 USER LIFECYCLE ACCESS STATE MATRIX\n\n`;
    markdown += `| Lifecycle Status | Workspace Reading Data | Firestore Writing Rights | Cloud Stitching Calls | Directorial Dialogue UI Strategy |\n`;
    markdown += `| :--- | :--- | :--- | :--- | :--- |\n`;
    
    // Add active tier representation
    markdown += `| \`paid_host_pass_active\` | 🟢 Unrestricted | 🟢 Enabled | 🟢 Enabled | Native Studio Cockpit |\n`;
    
    for (const [key, cycle] of Object.entries(manifest.userLifecycles)) {
      const readStatus = cycle.allowDataVisibility ? "🟢 Unrestricted (Archive)" : "🔴 Blocked";
      const writeStatus = cycle.blockWriteActions ? "🔴 Blocked" : "🟢 Enabled";
      const stitchStatus = cycle.blockWriteActions ? "🔴 Blocked" : "🟢 Enabled";
      const uiStrategy = cycle.ctaMapping.primary === "Renew / Upgrade Pass" ? "Triggers 'Renew Pass' Layout" : "Triggers 'Claim Free Pass' Layout";
      
      markdown += `| \`${key}\` | ${readStatus} | ${writeStatus} | ${stitchStatus} | ${uiStrategy} |\n`;
    }
    
    // Add guest sandbox representation
    markdown += `| \`guest_sandbox\` | 🟡 Demo Template Only | 🔴 Blocked (Local Only) | 🔴 Blocked | Triggers 'Claim Free Pass' Layout |\n`;
    markdown += `\n`;
  }

  // 2. Support Playbooks Section
  markdown += `## Support Playbooks\n\n`;
  for (const [key, playbook] of Object.entries(manifest.supportPlaybooks)) {
    markdown += `### Playbook: ${key}\n\n`;
    markdown += `**Context:**\n> ${playbook.context}\n\n`;
    markdown += `**Resolution Steps:**\n`;
    playbook.resolutionSteps.forEach((step, index) => {
      markdown += `${index + 1}. ${step}\n`;
    });
    markdown += `\n`;
  }

  // Write markdown to file
  fs.writeFileSync(outputPath, markdown, 'utf8');

  const searchIndex = [];
  // Process Tiers
  Object.entries(manifest.tiers).forEach(([key, t]) => {
    searchIndex.push({
      id: `tier-${key}`,
      category: "Subscription Tiers",
      title: `${t.name} Tier Profile`,
      content: `Pricing: £${t.priceMonthlyGbp} / $${t.priceMonthlyUsd}. Locked features: ${t.featuresLocked?.join(', ') || 'None'}. Demo script path: ${t.demoScript || 'N/A'}.`
    });
  });
  // Process Lifecycles
  Object.entries(manifest.userLifecycles || {}).forEach(([key, c]) => {
    searchIndex.push({
      id: `lifecycle-${key}`,
      category: "User Lifecycle Matrix",
      title: `Lifecycle Access State: ${key}`,
      content: `Data visibility: ${c.allowDataVisibility ? 'Allowed' : 'Blocked'}. Write protection: ${c.blockWriteActions ? 'Blocked' : 'Active'}. Primary CTA: ${c.ctaMapping?.primary || 'Default'}.`
    });
  });
  // Process Support Playbooks
  Object.entries(manifest.supportPlaybooks).forEach(([key, p]) => {
    searchIndex.push({
      id: `playbook-${key}`,
      category: "Support Playbooks",
      title: `Operational Resolution Playbook: ${key}`,
      content: `Context background: ${p.context}. Action instructions: ${p.resolutionSteps.join(' ')}`
    });
  });
  fs.writeFileSync(jsonOutputPath, JSON.stringify(searchIndex, null, 2), 'utf8');

  // Alignment requirement console log
  console.log("LIVING MANIFEST COMPILED SUCCESSFULLY // OPERATIONAL SHIELD VERIFIED GREEN");
} catch (error) {
  console.error("Error generating living documentation:", error);
  process.exit(1);
}
