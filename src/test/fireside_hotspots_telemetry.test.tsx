import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FiresideAuthHeader } from '@/components/fireside/FiresideAuthHeader';
import { FiresideModeSwitch } from '@/components/fireside/FiresideModeSwitch';
import { SingleCardPromptCarousel } from '@/components/fireside/SingleCardPromptCarousel';
import { TactileVoiceRecorder } from '@/components/fireside/TactileVoiceRecorder';
import { AlbumPhotoCaptureTray } from '@/components/fireside/AlbumPhotoCaptureTray';
import { FiresideCompletedReelCard } from '@/components/fireside/FiresideCompletedReelCard';
import { FiresideCinemaLightbox } from '@/components/fireside/FiresideCinemaLightbox';
import { FIRESIDE_PROMPT_SPARKS } from '@/lib/firesidePrompts';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'elder-test-123', email: 'elder@example.com' },
    signOut: vi.fn(),
  }),
}));

// Mock Next.js navigation Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Fireside Hotspots & Telemetry Regression Shield (Ticket #261)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. FiresideAuthHeader Hotspot Attributes', () => {
    it('renders canonical hotspot IDs for desktop navigation and sign-out', () => {
      render(<FiresideAuthHeader activePartTitle="Part I: Foundations" />);
      
      const desktopNav = document.querySelector('[data-hotspot-id="HS_FIRESIDE_NAV_DESKTOP_BTN"]');
      expect(desktopNav).toBeTruthy();
      expect(desktopNav?.getAttribute('href')).toBe('/studio');

      const signOutBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_SIGNOUT_BTN"]');
      expect(signOutBtn).toBeTruthy();
    });
  });

  describe('2. FiresideModeSwitch Hotspot Attributes', () => {
    it('renders canonical hotspot IDs for audio and video mode toggle tabs', () => {
      render(<FiresideModeSwitch mode="audio" onModeChange={vi.fn()} />);
      
      const audioModeBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_MODE_VOICE"]');
      const videoModeBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_MODE_VIDEO"]');
      
      expect(audioModeBtn).toBeTruthy();
      expect(videoModeBtn).toBeTruthy();
    });
  });

  describe('3. SingleCardPromptCarousel Hotspot Attributes', () => {
    it('renders canonical hotspot IDs across language pills, navigation, and speak CTA', () => {
      render(
        <SingleCardPromptCarousel
          prompts={FIRESIDE_PROMPT_SPARKS}
          activeLanguage="en"
          mediaMode="audio"
          onSelectPrompt={vi.fn()}
          onActivePromptChange={vi.fn()}
          onLanguageChange={vi.fn()}
          onPhotoPromptClick={vi.fn()}
        />
      );

      // Language pills
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_LANG_EN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_LANG_GU"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_LANG_PA"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_LANG_HI"]')).toBeTruthy();

      // Navigation and Action buttons
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_RANDOM_SPARK_BTN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_FOLLOWUPS_DRAWER_BTN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_PHOTO_DIGITISE_BTN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_PREV_STORY_BTN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_NEXT_STORY_BTN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_CONFIRM_STORY_BTN"]')).toBeTruthy();
    });
  });

  describe('4. TactileVoiceRecorder Hotspot Attributes', () => {
    it('renders canonical hotspot ID for Speak master button in idle state', () => {
      render(<TactileVoiceRecorder activeLanguage="en" />);
      const speakBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_VOICE_RECORD_BTN"]');
      expect(speakBtn).toBeTruthy();
    });
  });

  describe('5. AlbumPhotoCaptureTray Hotspot Attributes & Device-Aware Ergonomics', () => {
    it('renders canonical hotspot IDs for photo camera, gallery, and selfie ingress plus device-aware helper notes', async () => {
      render(<AlbumPhotoCaptureTray photos={[]} onPhotosChange={vi.fn()} />);
      
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_PHOTO_CAMERA_BTN"]')).toBeTruthy();
      expect(document.querySelector('[data-hotspot-id="HS_FIRESIDE_PHOTO_GALLERY_BTN"]')).toBeTruthy();
      
      const selfieBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_PHOTO_SELFIE_BTN"]');
      expect(selfieBtn).toBeTruthy();
      expect(selfieBtn?.textContent).toContain('Take a Selfie');

      // Device-aware helper notes: mobile (sm:hidden) vs desktop (hidden sm:inline)
      const mobileHelper = screen.getByTestId('photo-tray-helper-mobile');
      const desktopHelper = screen.getByTestId('photo-tray-helper-desktop');
      expect(mobileHelper.className).toContain('sm:hidden');
      expect(mobileHelper.textContent).toContain('Hold your phone flat over the vintage album photo on your lap');
      expect(desktopHelper.className).toContain('hidden sm:inline');
      expect(desktopHelper.textContent).toContain('Upload a high-resolution photograph from your computer or take a live webcam selfie');
    });
  });

  describe('6. FiresideCompletedReelCard Metadata & Bonus Memory Drawer CTA', () => {
    it('renders Take #, recorded date timestamp, duration, vintage photo strip, and Open Bonus Memory Drawer button', () => {
      const onWatch = vi.fn();
      const onBonus = vi.fn();

      render(
        <FiresideCompletedReelCard
          sceneId="part-1-scene-1"
          sceneTitle="Child of Two Worlds"
          sessionPhotos={[
            {
              id: 'p1',
              localUri: 'blob:https://dev.memoryweaver.studio/vintage-photo-1',
              caption: 'Mombasa 1962',
              capturedAt: '2026-09-26T16:00:00.000Z',
            } as any,
          ]}
          overrideDurationSeconds={14}
          onWatchTheatricalReel={onWatch}
          onAddBonusNote={onBonus}
        />
      );

      const takeTimestamp = screen.getByTestId('completed-reel-take-timestamp');
      expect(takeTimestamp.textContent).toContain('Take #1');
      expect(takeTimestamp.textContent).toContain('0m 14s');

      const photosStrip = screen.getByTestId('completed-reel-photos-strip');
      expect(photosStrip).toBeTruthy();

      const bonusBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_COMPLETED_BONUS_BTN"]');
      expect(bonusBtn?.textContent).toContain('Open Bonus Memory Drawer');
      fireEvent.click(bonusBtn!);
      expect(onBonus).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. FiresideCinemaLightbox Vintage Photo localUri & Finite Duration Guard', () => {
    it('renders HeirloomPhotoAttachment via localUri in audio mode and exposes Open Bonus Memory Drawer button', () => {
      const onClose = vi.fn();
      const onOpenBonus = vi.fn();

      render(
        <FiresideCinemaLightbox
          isOpen={true}
          onClose={onClose}
          onOpenBonusDrawer={onOpenBonus}
          sceneTitle="Child of Two Worlds"
          mediaMode="audio"
          mediaUrl="blob:https://dev.memoryweaver.studio/voice-1"
          durationSeconds={Infinity}
          photos={[
            {
              id: 'photo_vintage_1',
              localUri: 'blob:https://dev.memoryweaver.studio/vintage-1.jpg',
              caption: 'Ancestral Home',
            } as any,
          ]}
        />
      );

      const photoImg = screen.getByTestId('lightbox-heirloom-photo') as HTMLImageElement;
      expect(photoImg).toBeTruthy();
      expect(photoImg.getAttribute('src')).toBe('blob:https://dev.memoryweaver.studio/vintage-1.jpg');

      // Ensure Infinity duration never renders 'Infinity' or 'NaN' in the timecode display
      expect(document.body.textContent).not.toContain('Infinity');
      expect(document.body.textContent).not.toContain('NaN');

      const bonusBtn = document.querySelector('[data-hotspot-id="HS_FIRESIDE_LIGHTBOX_BONUS_BTN"]');
      expect(bonusBtn?.textContent).toContain('Open Bonus Memory Drawer');
      fireEvent.click(bonusBtn!);
      expect(onOpenBonus).toHaveBeenCalledTimes(1);
    });
  });
});

