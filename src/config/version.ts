import packageJson from '../../package.json';

// Single source of truth for telemetry, bug reports, and diagnostic logs
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || `v${packageJson.version}-MW-71`;
