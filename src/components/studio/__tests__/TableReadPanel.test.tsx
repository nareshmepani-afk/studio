import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableReadPanel } from '../TableReadPanel';

// Mock ResizeObserver for DOM elements
global.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
};

describe('TableReadPanel Calibration Component', () => {
  const mockVideoRef = React.createRef<HTMLDivElement>();
  const defaultProps = {
    isMinimised: false,
    onMinimiseToggle: vi.fn(),
    isTableReadActive: false,
    onEngageRehearsal: vi.fn(),
    rehearsalSpeed: 1.5,
    onRehearsalSpeedChange: vi.fn(),
    interviewLanguage: 'en' as const,
    videoContainerRef: mockVideoRef
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders the fully expanded Acoustic Table Read panel correctly', () => {
    render(<TableReadPanel {...defaultProps} />);

    // Check headings and sections
    expect(screen.getByText('Table Read active')).toBeInTheDocument();
    expect(screen.getByText(/Voice Shadowing/)).toBeInTheDocument();
    expect(screen.getByText(/Bilingual Pacing Status/)).toBeInTheDocument();
    expect(screen.getByText('UK English (Achernar)')).toBeInTheDocument();
    expect(screen.getByText(/150 WPM/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Engage Rehearsal/i })).toBeInTheDocument();
  });

  it('Renders the authentic Gujarati WaveNet bilingual status when Gujarati is selected', () => {
    render(<TableReadPanel {...defaultProps} interviewLanguage="gu" />);

    expect(screen.getByText('Gujarati (WaveNet-A)')).toBeInTheDocument();
  });

  it('Renders the minimised bubble view correctly', () => {
    render(<TableReadPanel {...defaultProps} isMinimised={true} />);

    expect(screen.getByText('Table Read')).toBeInTheDocument();
    expect(screen.queryByText('Bilingual Pacing Status')).not.toBeInTheDocument();
  });

  it('Triggers onMinimiseToggle callback when clicking minimisation button', () => {
    const onMinimiseToggle = vi.fn();
    render(<TableReadPanel {...defaultProps} onMinimiseToggle={onMinimiseToggle} />);

    const minimiseBtn = screen.getByTitle('Minimise Panel');
    fireEvent.click(minimiseBtn);

    expect(onMinimiseToggle).toHaveBeenCalledWith(true);
  });

  it('Triggers onMinimiseToggle callback to expand when clicking restore button in minimised view', () => {
    const onMinimiseToggle = vi.fn();
    render(<TableReadPanel {...defaultProps} isMinimised={true} onMinimiseToggle={onMinimiseToggle} />);

    const restoreBtn = screen.getByTitle('Restore Panel');
    fireEvent.click(restoreBtn);

    expect(onMinimiseToggle).toHaveBeenCalledWith(false);
  });

  it('Calls onEngageRehearsal callback when clicking Engage Rehearsal button', () => {
    const onEngageRehearsal = vi.fn();
    render(<TableReadPanel {...defaultProps} onEngageRehearsal={onEngageRehearsal} />);

    const engageBtn = screen.getByRole('button', { name: /Engage Rehearsal/i });
    fireEvent.click(engageBtn);

    expect(onEngageRehearsal).toHaveBeenCalled();
  });

  it('Calls onRehearsalSpeedChange when adjusting the WPM Pace Dial slider', () => {
    const onRehearsalSpeedChange = vi.fn();
    render(<TableReadPanel {...defaultProps} onRehearsalSpeedChange={onRehearsalSpeedChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2.0' } });

    expect(onRehearsalSpeedChange).toHaveBeenCalledWith(2.0);
  });
});
