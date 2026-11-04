import { describe, it, expect } from 'vitest';
import {
  formatHardwareDeviceLabel,
  isExternalHardwareDevice,
  deduplicateHardwareDevices,
  type HardwareDeviceOption,
} from '@/hooks/useCamera';
import {
  sanitizeStudioHardwareDevices,
  formatStudioHardwareOptionLabel,
} from '@/components/studio/SoloStage';

describe('Punch-List 58.1 — Hardware Label Sanitiser & Windows Endpoint Deduplicator', () => {
  it('1. strips raw USB hex suffixes like (291a:3367) and (2ca3:b00d) from display labels without mutating raw deviceId values', () => {
    const rawDevices: MediaDeviceInfo[] = [
      {
        deviceId: 'usb-cam-guid-291a:3367-raw',
        groupId: 'grp-anker-cam',
        kind: 'videoinput',
        label: 'AnkerWork C310 Webcam (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'usb-mic-guid-2ca3:b00d-raw',
        groupId: 'grp-dji-mic',
        kind: 'audioinput',
        label: 'DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
    ];

    const sanitizedVideo = sanitizeStudioHardwareDevices(
      rawDevices.filter((d) => d.kind === 'videoinput') as unknown as HardwareDeviceOption[],
      'videoinput'
    );
    const sanitizedAudio = sanitizeStudioHardwareDevices(
      rawDevices.filter((d) => d.kind === 'audioinput') as unknown as HardwareDeviceOption[],
      'audioinput'
    );

    expect(sanitizedVideo).toHaveLength(1);
    expect(sanitizedVideo[0].deviceId).toBe('usb-cam-guid-291a:3367-raw');
    expect(sanitizedVideo[0].label).toBe('AnkerWork C310 Webcam');
    expect(formatStudioHardwareOptionLabel(sanitizedVideo[0], 0, 'videoinput')).toBe(
      'AnkerWork C310 Webcam (USB)'
    );

    expect(sanitizedAudio).toHaveLength(1);
    expect(sanitizedAudio[0].deviceId).toBe('usb-mic-guid-2ca3:b00d-raw');
    expect(sanitizedAudio[0].label).toBe('DJI Microphone (Wireless Microphone RX)');
    expect(formatStudioHardwareOptionLabel(sanitizedAudio[0], 0, 'audioinput')).toBe(
      'DJI Microphone (Wireless Microphone RX) (USB / External)'
    );
  });

  it('2. deduplicates Windows "Default -" and "Communications -" shadow audio endpoints so each physical microphone renders once', () => {
    const windowsAudioEndpoints: MediaDeviceInfo[] = [
      {
        deviceId: 'default',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'Default - DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'communications',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'Communications - DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'physical-dji-endpoint-01',
        groupId: 'grp-dji',
        kind: 'audioinput',
        label: 'DJI Microphone (Wireless Microphone RX) (2ca3:b00d)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'default-anker-shadow',
        groupId: 'grp-anker',
        kind: 'audioinput',
        label: 'Default - Microphone (AnkerWork C310 Webcam) (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'comms-anker-shadow',
        groupId: 'grp-anker',
        kind: 'audioinput',
        label: 'Communications - Microphone (AnkerWork C310 Webcam) (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'physical-anker-endpoint-02',
        groupId: 'grp-anker',
        kind: 'audioinput',
        label: 'Microphone (AnkerWork C310 Webcam) (291a:3367)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'default-realtek-shadow',
        groupId: 'grp-realtek',
        kind: 'audioinput',
        label: 'Default - Microphone (Realtek(R) Audio)',
        toJSON: () => ({}),
      },
      {
        deviceId: 'physical-realtek-endpoint-03',
        groupId: 'grp-realtek',
        kind: 'audioinput',
        label: 'Microphone (Realtek(R) Audio)',
        toJSON: () => ({}),
      },
    ];

    const deduplicated = deduplicateHardwareDevices(windowsAudioEndpoints, 'audioinput');
    expect(deduplicated).toHaveLength(3);

    expect(deduplicated.map((d) => d.deviceId)).toEqual([
      'physical-dji-endpoint-01',
      'physical-anker-endpoint-02',
      'physical-realtek-endpoint-03',
    ]);

    expect(deduplicated.map((d) => d.label)).toEqual([
      'DJI Microphone (Wireless Microphone RX)',
      'Microphone (AnkerWork C310 Webcam)',
      'Microphone (Realtek(R) Audio)',
    ]);
  });

  it('3. formats "Realtek(R) Audio" cleanly with a (Built-In) badge even when vendor:product hex codes or USB bus strings are present', () => {
    expect(isExternalHardwareDevice('Microphone (Realtek(R) Audio)', 'realtek-id')).toBe(false);
    expect(
      isExternalHardwareDevice('Microphone (Realtek(R) Audio) (0bda:4014)', 'usb-realtek-codec')
    ).toBe(false);

    const formattedStandard = formatStudioHardwareOptionLabel(
      {
        deviceId: 'realtek-audio-guid',
        label: 'Microphone (Realtek(R) Audio)',
        kind: 'audioinput',
        isExternalUsb: false,
      },
      0,
      'audioinput'
    );
    expect(formattedStandard).toBe('Microphone (Realtek(R) Audio) (Built-In)');

    const formattedWithHexAndMisflaggedUsb = formatStudioHardwareOptionLabel(
      {
        deviceId: 'realtek-usb-codec-guid',
        label: 'Default - Microphone (Realtek(R) Audio) (0bda:4014)',
        kind: 'audioinput',
        isExternalUsb: true, // Defensive override must still force (Built-In) for Realtek
      },
      1,
      'audioinput'
    );
    expect(formattedWithHexAndMisflaggedUsb).toBe('Microphone (Realtek(R) Audio) (Built-In)');
    expect(formatHardwareDeviceLabel('Default - Realtek(R) Audio (0bda:4014)')).toBe(
      'Realtek(R) Audio'
    );
  });
});
