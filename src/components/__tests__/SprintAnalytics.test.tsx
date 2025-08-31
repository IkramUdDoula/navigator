import { render, screen } from '@testing-library/react';
import { SprintAnalytics } from '../SprintAnalytics';
import { GitLabIssue, GitLabUser, GitLabMilestone } from '../../types/gitlab';

// Mock the sprintAnalyticsUtils module
jest.mock('../../lib/sprintAnalyticsUtils', () => ({
  calculateSprintMetrics: jest.fn(),
  calculateVelocityMetrics: jest.fn(),
  calculateTimeMetrics: jest.fn(),
  calculateHourMetrics: jest.fn(),
  getCompletionStatus: jest.fn(),
  getVelocityStatus: jest.fn(),
  getHourEfficiencyStatus: jest.fn(),
  formatHours: jest.fn((hours: number) => `${hours}h`),
  formatVelocity: jest.fn((velocity: number) => `${velocity} issues/day`),
  formatPercentage: jest.fn((percentage: number) => `${percentage}%`),
  formatDays: jest.fn((days: number) => days === 1 ? '1 day' : `${days} days`)
}));

describe('SprintAnalytics', () => {
  let mockIssues: GitLabIssue[];
  let mockUsers: GitLabUser[];
  let mockMilestone: GitLabMilestone;

  beforeEach(() => {
    mockUsers = [
      { id: 1, username: 'user1', name: 'User One', avatar_url: 'avatar1.jpg' },
      { id: 2, username: 'user2', name: 'User Two', avatar_url: 'avatar2.jpg' }
    ];

    mockMilestone = {
      id: 1,
      title: 'Sprint 1',
      state: 'active',
      start_date: '2024-01-01T00:00:00Z',
      due_date: '2024-01-14T23:59:59Z'
    };

    mockIssues = [
      {
        id: 1,
        iid: 101,
        title: 'Issue 1',
        description: 'Description 1',
        state: 'closed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        labels: [],
        assignees: [mockUsers[0]],
        author: mockUsers[0],
        web_url: 'https://gitlab.com/issue/1',
        time_stats: {
          time_estimate: 7200,
          total_time_spent: 3600
        },
        iteration: {
          title: 'Sprint 1',
          start_date: '2024-01-01T00:00:00Z',
          due_date: '2024-01-14T23:59:59Z',
          id: 1,
          state: 'started'
        }
      }
    ];

    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    const { 
      calculateSprintMetrics, 
      calculateVelocityMetrics, 
      calculateTimeMetrics, 
      calculateHourMetrics,
      getCompletionStatus,
      getVelocityStatus
    } = require('../../lib/sprintAnalyticsUtils');

    calculateSprintMetrics.mockReturnValue({
      totalIssues: 5,
      completedIssues: 3,
      completionRate: 60,
      timeRemaining: 7,
      achievedVelocity: 1.5,
      requiredVelocity: 0.8,
      estimatedHours: 40,
      spentHours: 25,
      sprintCapacityHours: 200
    });

    calculateTimeMetrics.mockReturnValue({
      sprintStartDate: '2024-01-01T00:00:00Z',
      sprintEndDate: '2024-01-14T23:59:59Z',
      totalSprintDays: 14,
      elapsedDays: 7,
      remainingDays: 7,
      elapsedPercentage: 50
    });

    calculateVelocityMetrics.mockReturnValue({
      achievedVelocity: 1.5,
      requiredVelocity: 0.8,
      elapsedDays: 7,
      remainingDays: 7,
      status: 'good'
    });

    calculateHourMetrics.mockReturnValue({
      totalEstimated: 40,
      totalSpent: 25,
      sprintCapacity: 200,
      utilizationPercentage: 20,
      progressPercentage: 62.5,
      efficiency: 'good'
    });

    getCompletionStatus.mockReturnValue('good');
    getVelocityStatus.mockReturnValue('good');
  });

  it('should render sprint analytics with all metric cards', () => {
    render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
      />
    );

    // Check for header
    expect(screen.getByText('Sprint Analytics')).toBeInTheDocument();
    expect(screen.getByText('Real-time metrics for Sprint 1')).toBeInTheDocument();

    // Check for all 7 metric cards
    expect(screen.getByText('Total Issues')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    expect(screen.getByText('Velocity')).toBeInTheDocument();
    expect(screen.getByText('Estimated Hours')).toBeInTheDocument();
    expect(screen.getByText('Progress Hours')).toBeInTheDocument();
  });

  it('should display correct metric values', () => {
    render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
      />
    );

    // Total Issues
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Completed Issues
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('of 5')).toBeInTheDocument();
    
    // Completion Rate
    expect(screen.getByText('60%')).toBeInTheDocument();
    
    // Time Remaining
    expect(screen.getByText('7 days')).toBeInTheDocument();
    
    // Velocity
    expect(screen.getByText('1.5 issues/day')).toBeInTheDocument();
    expect(screen.getByText('Need 0.8 issues/day')).toBeInTheDocument();
    
    // Estimated Hours
    expect(screen.getByText('40h')).toBeInTheDocument();
    expect(screen.getByText('20% of sprint capacity')).toBeInTheDocument();
    
    // Progress Hours
    expect(screen.getByText('25h')).toBeInTheDocument();
    expect(screen.getByText('62.5% of estimated')).toBeInTheDocument();
  });

  it('should show empty state when no issues', () => {
    render(
      <SprintAnalytics
        issues={[]}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
      />
    );

    expect(screen.getByText('No sprint data available')).toBeInTheDocument();
    expect(screen.getByText('Sprint metrics will appear when issues and iterations are available.')).toBeInTheDocument();
  });

  it('should handle missing current iteration', () => {
    render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration={null}
        milestone={mockMilestone}
      />
    );

    expect(screen.getByText('Real-time metrics for current sprint')).toBeInTheDocument();
  });

  it('should filter issues by current iteration', () => {
    const { calculateSprintMetrics } = require('../../lib/sprintAnalyticsUtils');
    
    render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
      />
    );

    // Verify calculateSprintMetrics was called with filtered issues
    expect(calculateSprintMetrics).toHaveBeenCalledWith(
      mockIssues,
      'Sprint 1',
      mockUsers,
      mockMilestone
    );
  });

  it('should handle missing milestone', () => {
    render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
      />
    );

    // Should still render without errors
    expect(screen.getByText('Sprint Analytics')).toBeInTheDocument();
  });

  it('should apply responsive grid layout classes', () => {
    const { container } = render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
      />
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'md:grid-cols-2', 
      'lg:grid-cols-3',
      'xl:grid-cols-4'
    );
  });

  it('should pass status indicators to metric cards', () => {
    const { getCompletionStatus, getVelocityStatus } = require('../../lib/sprintAnalyticsUtils');
    
    getCompletionStatus.mockReturnValue('poor');
    getVelocityStatus.mockReturnValue('good');
    
    render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
      />
    );

    // Verify status calculation functions were called
    expect(getCompletionStatus).toHaveBeenCalledWith(60, 50);
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <SprintAnalytics
        issues={mockIssues}
        users={mockUsers}
        currentIteration="Sprint 1"
        milestone={mockMilestone}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});