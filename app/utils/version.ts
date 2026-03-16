// utils/version.ts
export const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'local-dev';

if (typeof window !== 'undefined') {
  console.log(`🚀 MemoryWeaver.Studio Version: ${VERSION}`);
}
