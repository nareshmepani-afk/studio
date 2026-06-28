export interface UserJourneySnapshot {
  userId: string;
  userEmail: string;
  userTier: 'Standard' | 'Premium';
  activeSession: {
    currentStep: 'idle' | 'recording' | 'previewing' | 'stitching';
    currentInviteId: string;
    lastHeartbeat: number; // Unix timestamp to compute active state without open listeners
  };
  storageMetrics: {
    totalBytesUsed: number;
    reelsCompiledCount: number;
  };
}
