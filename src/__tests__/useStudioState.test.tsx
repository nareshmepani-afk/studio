import { render, fireEvent } from '@testing-library/react';
import { useStudioState, StudioProvider } from '../hooks/studio/useStudioState';
import { vi } from 'vitest';

describe('useStudioState', () => {
  it('should toggle isRecording state and reflect in Tally Light', async () => {
    const TestComponent = () => {
      const { isRecording, actions } = useStudioState();

      return (
        <div>
          <div data-testid="tally-light" style={{ backgroundColor: isRecording ? 'red' : 'green' }}></div>
          <button onClick={actions.toggleRecording}>Toggle Recording</button>
        </div>
      );
    };

    const { getByTestId, getByText } = render(
      <StudioProvider>
        <TestComponent />
      </StudioProvider>
    );

    const tallyLight = getByTestId('tally-light');
    const toggleButton = getByText('Toggle Recording');

    // Initial state: Not recording (green)
    expect(tallyLight.style.backgroundColor).toBe('green');

    // Simulate remote action: Start recording
    fireEvent.click(toggleButton);

    // Tally light should turn red
    expect(tallyLight.style.backgroundColor).toBe('red');

    // Simulate remote action: Stop recording
    fireEvent.click(toggleButton);

    // Tally light should turn green again
    expect(tallyLight.style.backgroundColor).toBe('green');
  });
});
