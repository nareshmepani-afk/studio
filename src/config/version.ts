import packageJson from '../../package.json';

const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '';
const buildTag = commitSha ? `.${commitSha}` : '';

// Single source of truth for telemetry, bug reports, and diagnostic logs
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || `v${packageJson.version}-MW-71${buildTag}`;


