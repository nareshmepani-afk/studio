/**
 * @fileOverview Proxy file to resolve legacy imports and prevent module resolution errors.
 * All types are now centralized in @/types/index.ts
 */

export * from './types/index';

export type PageProps<T = {}> = {
  params: Promise<T>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
