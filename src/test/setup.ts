import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Mock Firebase environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'mock-recaptcha-key';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
