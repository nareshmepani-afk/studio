export interface RecordedMemory {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  timestamp: number;
  script?: string;
  mode: 'solo' | 'interview';
}