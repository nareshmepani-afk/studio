export interface WhitelistUser {
  email: string;
  isActive: boolean;
  mfaSetupComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
}
