import { describe, it, expect } from 'vitest';
import { getClientFirebaseConfig } from '../lib/firebase/config';

describe('Firebase Auth Settings Diagnostics', () => {
  it('resolves correct authDomain configurations for staging context', () => {
    const config = getClientFirebaseConfig();
    expect(config.projectId).toBe('memory-weaver-dev');
    expect(config.authDomain).toBe('memory-weaver-dev.firebaseapp.com');
  });
});
