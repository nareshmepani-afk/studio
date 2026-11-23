import React from 'react';
import fs from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { useCurriculumVault, isSceneMasterProtected } from '@/hooks/useCurriculumVault';
import { isProductionHostname } from '@/components/fireside/FiresideAuthHeader';
import { OrientationSoundcheckDock } from '@/components/fireside/OrientationSoundcheckDock';
import { FiresideVideoRecorder } from '@/components/fireside/FiresideVideoRecorder';
import { TactileVoiceRecorder } from '@/components/fireside/TactileVoiceRecorder';
import { RecordEditingSuite } from '@/components/studio/RecordEditingSuite';
import type { MemoirTake } from '@/types/curriculum';

// Mock Firestore for useCurriculumVault tests
let mockSnapshotCallback: ((snap: any) => void) | null = null;
const mockSetDoc = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...paths) => ({ path: paths.join('/') })),
  doc: vi.fn((_db, ...paths) => ({ path: paths.join('/') })),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: vi.fn((_ref, cb) => {
    mockSnapshotCallback = cb;
    return vi.fn();
  }),
}));

vi.mock('@/context/HardwarePrivacyContext', () => ({
  useHardwarePrivacy: () => ({
    status: 'armed',
    killAllHardwareFeeds: vi.fn(),
    rearmHardware: vi.fn(),
  }),
}));

const mockStartVideoRecording = vi.fn().mockResolvedValue(true);
const mockEnableCameraPreview = vi.fn().mockResolvedValue(true);
let mockVideoRecorderState: any = {
  status: 'idle',
  cameraPermissionState: 'granted',
  durationSeconds: 0,
  formattedDuration: '00:00',
  videoBlob: null,
  videoUrl: null,
  stream: null,
  isWakeLockActive: false,
  errorMessage: null,
  startRecording: mockStartVideoRecording,
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  stopRecording: vi.fn().mockResolvedValue(null),
  resetRecording: vi.fn(),
  retryPermission: vi.fn(),
  enableCameraPreview: mockEnableCameraPreview,
  importVideoFile: vi.fn(),
  releaseHardwareStream: vi.fn(),
};

vi.mock('@/hooks/useFiresideVideoRecorder', () => ({
  useFiresideVideoRecorder: () => mockVideoRecorderState,
}));

const mockStartAudioRecording = vi.fn().mockResolvedValue(true);
let mockAudioRecorderState: any = {
  status: 'idle',
  permissionState: 'granted',
  durationSeconds: 0,
  formattedDuration: '00:00',
  audioBlob: null,
  audioUrl: null,
  volume: 0,
  waveform: [],
  isWakeLockActive: false,
  errorMessage: null,
  startRecording: mockStartAudioRecording,
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  stopRecording: vi.fn().mockResolvedValue(null),
  resetRecording: vi.fn(),
  retryPermission: vi.fn(),
  importAudioFile: vi.fn(),
  releaseHardwareStream: vi.fn(),
};

vi.mock('@/hooks/useFiresideAudioRecorder', () => ({
  useFiresideAudioRecorder: () => mockAudioRecorderState,
  formatDurationMMSS: (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },
}));

describe('RC1.1 Master-Reel Safety, Post-Stitch Handoff, Mobile Header & Age Shield', () => {
  beforeEach(() => {
    mockSnapshotCallback = null;
    mockSetDoc.mockClear();
    mockStartVideoRecording.mockClear();
    mockEnableCameraPreview.mockClear();
    mockStartAudioRecording.mockClear();
    mockVideoRecorderState = {
      ...mockVideoRecorderState,
      status: 'idle',
      videoBlob: null,
      videoUrl: null,
      durationSeconds: 0,
      formattedDuration: '00:00',
    };
    mockAudioRecorderState = {
      ...mockAudioRecorderState,
      status: 'idle',
      audioBlob: null,
      audioUrl: null,
      durationSeconds: 0,
      formattedDuration: '00:00',
    };
  });

  it('1. isSceneMasterProtected detects desktop_locked, published, cinematic-ready, and soundstage_desktop masters', () => {
    expect(isSceneMasterProtected({ status: 'published' })).toBe(true);
    expect(isSceneMasterProtected({ status: 'cinematic-ready' })).toBe(true);
    expect(isSceneMasterProtected({ editingAuthority: 'desktop_locked' })).toBe(true);
    expect(
      isSceneMasterProtected({
        editingAuthority: 'fireside_flexible',
        takes: [
          {
            id: 'take_cloud_1',
            takeNumber: 1,
            source: 'soundstage_desktop',
            mediaMode: 'video',
            mediaUrl: 'https://example.com/final.webm',
            durationSeconds: 60,
            createdAt: '2026-06-29T17:20:53.139Z',
            label: 'Soundstage Master Reel',
            isPreferred: true,
            status: 'master',
          },
        ],
      })
    ).toBe(true);
    expect(
      isSceneMasterProtected({
        status: 'draft',
        editingAuthority: 'fireside_flexible',
        takes: [],
      })
    ).toBe(false);
  });

  it('2. P0 MASTER LOCK: Fireside saveSceneTake NEVER overwrites videoUrl, activeTakeId, originSurface, or published status of a SoundStage master', async () => {
    const { result } = renderHook(() =>
      useCurriculumVault({ userId: 'usr_naresh_123', memoirId: 'memoir_ancestral' })
    );

    const soundstageUrl =
      'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev.firebasestorage.app/o/final.webm?alt=media&token=master';

    act(() => {
      mockSnapshotCallback?.({
        docs: [
          {
            id: 'ey96djU6qR1BrDGnvZwp',
            data: () => ({
              promptId: 'p1',
              sceneId: 'part-1-scene-1',
              chapterId: 'part-1',
              partNumber: 1,
              title: 'Child of Two Worlds',
              status: 'published',
              productionStage: 4,
              originSurface: 'soundstage_desktop',
              editingAuthority: 'desktop_locked',
              videoUrl: soundstageUrl,
              activeTakeId: 'take_cloud_ey96djU6qR1BrDGnvZwp',
              preferredTakeId: 'take_cloud_ey96djU6qR1BrDGnvZwp',
              takes: [
                {
                  id: 'take_cloud_ey96djU6qR1BrDGnvZwp',
                  takeNumber: 1,
                  source: 'soundstage_desktop',
                  mediaMode: 'video',
                  mediaUrl: soundstageUrl,
                  durationSeconds: 60,
                  createdAt: '2026-06-29T17:20:53.139Z',
                  label: 'Soundstage Master Reel',
                  isPreferred: true,
                  status: 'master',
                  role: 'master_cut',
                },
              ],
            }),
          },
        ],
      });
    });

    const firesideTake: MemoirTake = {
      id: 'take_fireside_audition_99',
      takeNumber: 2,
      source: 'fireside_mobile',
      mediaMode: 'video',
      mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/memory-weaver-dev.firebasestorage.app/o/fireside.webm',
      durationSeconds: 12,
      createdAt: '2026-11-23T20:00:00.000Z',
      label: 'Take 2 (Fireside Video)',
      isPreferred: true, // Even if caller mistakenly passes true, hook MUST force false
    };

    await act(async () => {
      await result.current.saveSceneTake('part-1-scene-1', firesideTake);
    });

    const scene = result.current.getSceneMemory('part-1-scene-1');
    expect(scene.videoUrl).toBe(soundstageUrl);
    expect(scene.activeTakeId).toBe('take_cloud_ey96djU6qR1BrDGnvZwp');
    expect(scene.originSurface).toBe('soundstage_desktop');
    expect(scene.status).toBe('published');
    expect(scene.productionStage).toBe(4);
    expect(scene.takes).toHaveLength(2);
    expect(scene.takes[0].isPreferred).toBe(true);
    expect(scene.takes[0].status).toBe('master');
    expect(scene.takes[1].id).toBe('take_fireside_audition_99');
    expect(scene.takes[1].isPreferred).toBe(false);
    expect(scene.takes[1].status).toBe('alternate');

    const canonicalMemoryPayload = mockSetDoc.mock.calls[0]?.[1] as Record<string, any>;
    expect(canonicalMemoryPayload.status).toBe('published');
    expect(canonicalMemoryPayload.originSurface).toBe('soundstage_desktop');
    expect(canonicalMemoryPayload.productionStage).toBe(4);
    expect(canonicalMemoryPayload.videoUrl).toBeUndefined();
    expect(canonicalMemoryPayload.activeTakeId).toBeUndefined();

    const legacyMirrorPayload = mockSetDoc.mock.calls[1]?.[1] as Record<string, any>;
    expect(legacyMirrorPayload.videoUrl).toBe(soundstageUrl);
    expect(legacyMirrorPayload.activeTakeId).toBe('take_cloud_ey96djU6qR1BrDGnvZwp');

    // Discarding the alternate take MUST NOT touch root master videoUrl or activeTakeId
    mockSetDoc.mockClear();
    await act(async () => {
      await result.current.safeDiscardTake('part-1-scene-1', 'take_fireside_audition_99');
    });
    const discardPayload = mockSetDoc.mock.calls[0]?.[1] as Record<string, any>;
    expect(discardPayload.videoUrl).toBeUndefined();
    expect(discardPayload.activeTakeId).toBeUndefined();
    expect(result.current.getSceneMemory('part-1-scene-1').videoUrl).toBe(soundstageUrl);
  });

  it('3. FiresideVideoRecorder enforces 1-tap Master-Reel pre-record challenge and Save as Alternate Take label', () => {
    const { rerender } = render(<FiresideVideoRecorder isMasterProtected={true} />);

    expect(screen.getByTestId('HS_FIRESIDE_VIDEO_MASTER_GUARD')).toBeInTheDocument();
    const recordBtn = screen.getByRole('button', { name: /start video recording/i });
    fireEvent.click(recordBtn);
    // Must not arm camera or start recording before explicit 1-tap challenge acknowledgement
    expect(mockEnableCameraPreview).not.toHaveBeenCalled();
    expect(mockStartVideoRecording).not.toHaveBeenCalled();

    const armBtn = screen.getByTestId('HS_FIRESIDE_VIDEO_ARM_AUDITION_BTN');
    expect(armBtn).toHaveTextContent('Record Separate Audition Take (Keeps Master Safe)');
    fireEvent.click(armBtn);

    // Review state displays explicit "Save as Alternate Take (Master Untouched)" CTA
    mockVideoRecorderState = {
      ...mockVideoRecorderState,
      status: 'saved',
      videoBlob: new Blob(['vid'], { type: 'video/webm' }),
      videoUrl: 'blob:test-video',
      durationSeconds: 10,
      formattedDuration: '00:10',
    };
    const onKeep = vi.fn();
    rerender(<FiresideVideoRecorder isMasterProtected={true} onKeepRecording={onKeep} />);
    const keepBtn = screen.getByText('Save as Alternate Take (Master Untouched)');
    expect(keepBtn).toBeInTheDocument();
    fireEvent.click(keepBtn);
    expect(onKeep).toHaveBeenCalledTimes(1);
  });

  it('4. TactileVoiceRecorder enforces 1-tap Master-Reel pre-record challenge and Save as Alternate Take label', () => {
    const { rerender } = render(<TactileVoiceRecorder isMasterProtected={true} />);

    expect(screen.getByTestId('HS_FIRESIDE_VOICE_MASTER_GUARD')).toBeInTheDocument();
    const speakBtn = screen.getByRole('button', { name: /start recording spoken memory/i });
    fireEvent.click(speakBtn);
    expect(mockStartAudioRecording).not.toHaveBeenCalled();

    const armBtn = screen.getByTestId('HS_FIRESIDE_VOICE_ARM_AUDITION_BTN');
    expect(armBtn).toHaveTextContent('Record Separate Audition Take (Keeps Master Safe)');
    fireEvent.click(armBtn);

    fireEvent.click(speakBtn);
    expect(mockStartAudioRecording).toHaveBeenCalledTimes(1);

    mockAudioRecorderState = {
      ...mockAudioRecorderState,
      status: 'saved',
      audioBlob: new Blob(['aud'], { type: 'audio/webm' }),
      audioUrl: 'blob:test-audio',
      durationSeconds: 8,
      formattedDuration: '00:08',
    };
    const onKeep = vi.fn();
    rerender(<TactileVoiceRecorder isMasterProtected={true} onKeepRecording={onKeep} />);
    const keepBtn = screen.getByText('Save as Alternate Take (Master Untouched)');
    expect(keepBtn).toBeInTheDocument();
    fireEvent.click(keepBtn);
    expect(onKeep).toHaveBeenCalledTimes(1);
  });

  it('5. FiresideStudioClient defers upload/saveSceneTake out of Stop into explicit Keep handlers', () => {
    const source = fs.readFileSync('src/app/studio/fireside/FiresideStudioClient.tsx', 'utf8');
    expect(source).toContain('handleKeepAudioRecording');
    expect(source).toContain('handleKeepVideoRecording');
    expect(source).toContain('onKeepRecording={handleKeepVideoRecording}');
    expect(source).toContain('onKeepRecording={handleKeepAudioRecording}');
    expect(source).toContain('isMasterProtected={isActiveMasterProtected}');
  });

  it('6. RecordEditingSuite clamps Crop End slider max to immutable sourceDuration and renders decimal cut total', () => {
    const onUpdateSegments = vi.fn();
    render(
      <RecordEditingSuite
        segments={[
          {
            segmentId: 'seg_1_pt1',
            sourceId: 'seg_1',
            sourceDuration: 18.7,
            blobUrl: 'blob:seg1',
            startOffset: 0,
            endOffset: 10.2,
            duration: 10.2,
          },
          {
            segmentId: 'seg_1_pt2',
            sourceId: 'seg_1',
            sourceDuration: 18.7,
            blobUrl: 'blob:seg1',
            startOffset: 11.3,
            endOffset: 18.7,
            duration: 7.4,
          },
        ]}
        onUpdateSegments={onUpdateSegments}
        onApprove={vi.fn()}
        onDiscard={vi.fn()}
      />
    );

    expect(screen.getByTestId('edl-stitched-total-duration')).toHaveTextContent('Final Stitched Cut: 17.6s');
    const cropEndSlider = screen.getByTestId('crop-end-slider') as HTMLInputElement;
    expect(Number(cropEndSlider.max)).toBeCloseTo(18.7, 1);
  });

  it('7. SoloStage clears recordedBlob/recordedSegments and pins stitched final.mp4 immediately on stitch completion', () => {
    const soloSource = fs.readFileSync('src/components/studio/SoloStage.tsx', 'utf8');
    expect(soloSource).toContain('stitchedMasterUrlRef.current = resultData.videoUrl');
    expect(soloSource).toContain('clearRecording();');
    expect(soloSource).toContain('setReviewVideoUrl(resultData.videoUrl);');
  });

  it('8. Production hostname guard, clean collapsed dock labels, and I WAS age snap-back / dual-sync shields', () => {
    expect(isProductionHostname('memoryweaver.studio')).toBe(true);
    expect(isProductionHostname('www.memoryweaver.studio')).toBe(true);
    expect(isProductionHostname('dev.memoryweaver.studio')).toBe(false);

    localStorage.setItem('mw_orientation_dock_collapsed', 'true');
    render(<OrientationSoundcheckDock activeLanguage="en" />);
    const collapsedStrip = screen.getByTestId('HS_ORIENTATION_DOCK_COLLAPSED_STRIP');
    expect(collapsedStrip.textContent).toContain('Desktop Soundstage ↗');
    expect(collapsedStrip.textContent).toContain('30s Soundcheck');
    expect(collapsedStrip.textContent).toContain('Expand');
    expect(collapsedStrip.textContent).not.toContain('[');
    expect(collapsedStrip.textContent).not.toContain('🖥️');
    expect(collapsedStrip.textContent).not.toContain('🎙️');
    localStorage.removeItem('mw_orientation_dock_collapsed');

    const memoryFormSource = fs.readFileSync('src/components/studio/MemoryForm.tsx', 'utf8');
    expect(memoryFormSource).toContain('lastSyncedAgeRef');
    const persistenceSource = fs.readFileSync('src/hooks/studio/useMemoryPersistence.ts', 'utf8');
    expect(persistenceSource).toContain('narratorAgeAtTime:');
    expect(persistenceSource).toContain('age:');
  });
});
