
export type UserRole = 'Host' | 'Storyteller' | 'Guest' | 'Interviewer';

export interface BaseUser {
  uid: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
}

export interface Host extends BaseUser {
  role: 'Host';
  email: string;
  storageQuota: {
    used: number; // in bytes
    total: number; // in bytes
  };
  subscriptionStatus: 'active' | 'inactive' | 'trial';
}

export interface Storyteller extends BaseUser {
  role: 'Storyteller';
  // Storytellers are temporary and may not have a permanent account
  sessionExpiresAt: Date;
}

export interface Guest extends BaseUser {
  role: 'Guest';
  // Guests have read-only access, controlled by passes
  passExpiresAt: Date;
}

export interface Interviewer extends BaseUser {
  role: 'Interviewer';
  // Can be a Host or a trusted user with specific permissions
  permissions: {
    canStartSession: boolean;
    canManagePrompts: boolean;
  };
}

export type User = Host | Storyteller | Guest | Interviewer;
