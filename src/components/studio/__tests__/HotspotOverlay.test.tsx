import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HotspotOverlay } from '../HotspotOverlay';

describe('HotspotOverlay Component tests', () => {
  it('renders nothing initially', () => {
    const { queryByText } = render(<HotspotOverlay />);
    expect(queryByText(/HOTSPOT OVERLAY ACTIVE/)).toBeNull();
  });

  it('toggles visibility on Ctrl+Shift+H key combination', async () => {
    const { queryByText, getByText } = render(
      <div>
        <HotspotOverlay />
        <button data-hotspot-id="HS_TEST_RECORD">Record</button>
      </div>
    );

    // Press Ctrl+Shift+H
    fireEvent.keyDown(window, {
      key: 'h',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    await waitFor(() => {
      expect(getByText(/HOTSPOT OVERLAY ACTIVE/)).toBeDefined();
    });

    // Press again to hide
    fireEvent.keyDown(window, {
      key: 'h',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });

    await waitFor(() => {
      expect(queryByText(/HOTSPOT OVERLAY ACTIVE/)).toBeNull();
    });
  });
});
