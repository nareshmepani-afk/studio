import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnboxingCeremonyStage from '@/components/gifting/UnboxingCeremonyStage';
import { playWaxCrackAudio, unboxingAudio } from '@/lib/audio/unboxingAudio';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'storyteller-123', email: 'storyteller@example.com' },
    isAuthenticated: true,
  }),
}));

describe('MW-86: UnboxingCeremonyStage & Audio Engine Invariant Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Procedural Audio Engine (unboxingAudio.ts)', () => {
    it('exports playWaxCrackAudio that proxies to unboxingAudio.playWaxSealFractureSound', () => {
      const spy = vi.spyOn(unboxingAudio, 'playWaxSealFractureSound').mockImplementation(() => {});
      playWaxCrackAudio();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Theatrical Stage Framing & Optical Alignment', () => {
    const mockVoucher = {
      code: 'MW-VAULT-7K8P-9Q2M',
      tier: 'generational_vault' as const,
      vaultQuotaGb: 100,
      durationDays: null,
      status: 'unredeemed' as const,
      giverName: 'Anand Patel',
      recipientName: 'Kishor Patel',
      giftMessage: 'Dad, thank you for every sacrifice you made.',
      unboxingLanguage: 'en' as const,
    };

    it('renders the 2.39:1 letterbox header and British English entrance copy in Playfair Display', () => {
      render(<UnboxingCeremonyStage voucher={mockVoucher} code="MW-VAULT-7K8P-9Q2M" />);

      // Top bar check
      expect(screen.getByText(/2\.39:1 ANAMORPHIC LETTERBOX/i)).toBeInTheDocument();
      expect(screen.getByText(/528Hz HARMONIC ACOUSTIC/i)).toBeInTheDocument();

      // Entrance copy check adhering to Rule 20 UK English ("honour")
      expect(screen.getByText(/An heirloom production commissioned in your honour by/i)).toBeInTheDocument();
      expect(screen.getByText('Anand Patel')).toBeInTheDocument();
    });

    it('renders the centered wax seal with 35mm film icon and pill badge', () => {
      render(<UnboxingCeremonyStage voucher={mockVoucher} code="MW-VAULT-7K8P-9Q2M" />);

      expect(screen.getByText('HEIRLOOM PASS')).toBeInTheDocument();
      expect(screen.getByText('Click Wax Seal to Open')).toBeInTheDocument();
      const sealButton = screen.getByRole('button', { name: /Crack wax seal to open unboxing ceremony/i });
      expect(sealButton).toBeInTheDocument();
    });

    it('triggers acoustics and haptics upon seal tap, then reveals dedication and redemption CTA', async () => {
      const audioSpy = vi.spyOn(unboxingAudio, 'playWaxSealFractureSound').mockImplementation(() => {});
      const chimeSpy = vi.spyOn(unboxingAudio, 'playSolfeggioHarmonicChime').mockImplementation(() => {});
      const vibrateMock = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });

      render(<UnboxingCeremonyStage voucher={mockVoucher} code="MW-VAULT-7K8P-9Q2M" />);

      const sealButton = screen.getByRole('button', { name: /Crack wax seal to open unboxing ceremony/i });
      fireEvent.click(sealButton);

      // Verify acoustics & haptics
      expect(audioSpy).toHaveBeenCalledTimes(1);
      expect(vibrateMock).toHaveBeenCalledWith([20, 50, 30]);

      // Verify transition to revealed state (allows for 900ms crack phase + exit animation)
      await waitFor(() => {
        expect(chimeSpy).toHaveBeenCalledTimes(1);
        expect(screen.getAllByText(/Dad, thank you for every sacrifice you made/i)[0]).toBeInTheDocument();
        expect(screen.getByText('Welcome, Kishor Patel')).toBeInTheDocument();
        expect(screen.getByText(/Step Onto Your Soundstage/i)).toBeInTheDocument();
        expect(screen.getByText(/Archival Keepsake Pass & QR Portal/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('3. Cultural Diaspora Salutation Invariants', () => {
    it('correctly adapts salutation and seal text for Gujarati (gu)', () => {
      const guVoucher = {
        code: 'MW-VAULT-GUJR-1234',
        tier: 'generational_vault' as const,
        vaultQuotaGb: 100,
        status: 'unredeemed' as const,
        giverName: 'Bhavna',
        recipientName: 'દાદા',
        giftMessage: 'તમારી વાતો અમારો ખજાનો છે.',
        unboxingLanguage: 'gu' as const,
      };

      render(<UnboxingCeremonyStage voucher={guVoucher} code="MW-VAULT-GUJR-1234" />);

      expect(screen.getByText('વારસાગત ભેટ')).toBeInTheDocument();
      expect(screen.getByText('મુદ્રા તોડીને પ્રવેશ કરો')).toBeInTheDocument();
      expect(screen.getByText('તમારી જીવનયાત્રા અમારા પરિવારનો અમૂલ્ય વારસો છે.')).toBeInTheDocument();
    });

    it('correctly adapts salutation and seal text for Punjabi (pa)', () => {
      const paVoucher = {
        code: 'MW-PASS-PUNJ-5678',
        tier: 'director' as const,
        vaultQuotaGb: 15,
        status: 'unredeemed' as const,
        giverName: 'Harpreet',
        recipientName: 'ਬਾਬਾ ਜੀ',
        giftMessage: 'ਸਾਡੇ ਵੱਲੋਂ ਪਿਆਰ।',
        unboxingLanguage: 'pa' as const,
      };

      render(<UnboxingCeremonyStage voucher={paVoucher} code="MW-PASS-PUNJ-5678" />);

      expect(screen.getByText('ਵਿਰਾਸਤੀ ਤੋਹਫ਼ਾ')).toBeInTheDocument();
      expect(screen.getByText('ਮੋਹਰ ਤੋੜ ਕੇ ਖੋਲ੍ਹੋ')).toBeInTheDocument();
    });

    it('correctly adapts salutation and seal text for Hindi (hi)', () => {
      const hiVoucher = {
        code: 'MW-VAULT-HIND-9999',
        tier: 'generational_vault' as const,
        vaultQuotaGb: 100,
        status: 'unredeemed' as const,
        giverName: 'Amit',
        recipientName: 'माताजी',
        giftMessage: 'सादर प्रणाम।',
        unboxingLanguage: 'hi' as const,
      };

      render(<UnboxingCeremonyStage voucher={hiVoucher} code="MW-VAULT-HIND-9999" />);

      expect(screen.getByText('धरोहर उपहार')).toBeInTheDocument();
      expect(screen.getByText('मुद्रा तोड़कर खोलें')).toBeInTheDocument();
    });
  });
});
