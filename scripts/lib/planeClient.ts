/**
 * Thin CLI re-export wrapper pointing to the unified server Plane.so client
 * (`src/lib/planeClient.ts`) so local `tsx scripts/read-*.ts` tools share
 * the exact same O(1) `/work-items/{MW-xxx}/` client with 6000ms timeouts.
 */
export * from '../../src/lib/planeClient';
