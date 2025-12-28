import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyContent } from '../../components/Terminal/JourneyContent';
import type { Journey, JourneyWaypoint } from '@core/schema/journey';

// Mock journey data
const mockJourney: Journey = {
  id: 'test-journey',
  title: 'Test Journey',
  description: 'A test journey',
  waypoints: [
    { id: 'wp-1', title: 'First Waypoint', prompt: 'Explore the first topic' },
    { id: 'wp-2', title: 'Second Waypoint', prompt: 'Explore the second topic' },
  ],
  completionMessage: 'Journey complete!',
};

const mockWaypoint: JourneyWaypoint = mockJourney.waypoints[0];

describe('JourneyContent', () => {
  it('renders with minimal props', () => {
    const onAction = vi.fn();
    const onExit = vi.fn();

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={onAction}
        onExit={onExit}
      />
    );

    expect(screen.getByText('Test Journey')).toBeInTheDocument();
    expect(screen.getByText('First Waypoint')).toBeInTheDocument();
    expect(screen.getByText('Explore the first topic')).toBeInTheDocument();
  });

  it('shows progress count by default', () => {
    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('renders default actions on non-final waypoint', () => {
    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Explore This')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  it('renders Complete button on final waypoint', () => {
    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockJourney.waypoints[1]}
        journeyProgress={1}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Complete Journey')).toBeInTheDocument();
    expect(screen.queryByText('Next →')).not.toBeInTheDocument();
  });

  it('calls onAction with provenance when action clicked', () => {
    const onAction = vi.fn();

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={onAction}
        onExit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Explore This'));

    expect(onAction).toHaveBeenCalledTimes(1);
    const [action, provenance] = onAction.mock.calls[0];
    expect(action.type).toBe('explore');
    expect(provenance.journey.id).toBe('test-journey');
    expect(provenance.waypoint.id).toBe('wp-1');
  });

  it('calls onExit when exit button clicked', () => {
    const onExit = vi.fn();

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={onExit}
      />
    );

    fireEvent.click(screen.getByText('Exit'));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('respects display.showProgressBar: false', () => {
    const journeyWithConfig: Journey = {
      ...mockJourney,
      display: { showProgressBar: false },
    };

    render(
      <JourneyContent
        journey={journeyWithConfig}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.queryByText('1 of 2')).not.toBeInTheDocument();
  });

  it('uses custom section title from display.labels', () => {
    const journeyWithConfig: Journey = {
      ...mockJourney,
      display: { labels: { sectionTitle: 'Guided Path' } },
    };

    render(
      <JourneyContent
        journey={journeyWithConfig}
        currentWaypoint={mockWaypoint}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Guided Path')).toBeInTheDocument();
  });

  it('renders custom actions from waypoint.actions', () => {
    const waypointWithActions: JourneyWaypoint = {
      ...mockWaypoint,
      actions: [
        { type: 'custom', label: 'Do Something', command: 'test' },
      ],
    };

    render(
      <JourneyContent
        journey={mockJourney}
        currentWaypoint={waypointWithActions}
        journeyProgress={0}
        journeyTotal={2}
        onAction={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('Do Something')).toBeInTheDocument();
    expect(screen.queryByText('Explore This')).not.toBeInTheDocument();
  });
});
