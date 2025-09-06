import {
  calculateSprintMetrics,
  calculateVelocityMetrics,
  calculateTimeMetrics,
  calculateHourMetrics,
  calculateSprintCapacity,
  getCompletionStatus,
  getVelocityStatus,
  getHourEfficiencyStatus,
  formatHours,
  formatVelocity,
  formatPercentage,
  formatDays
} from '../sprintAnalyticsUtils';
import { GitLabIssue, GitLabUser, GitLabMilestone } from '../../types/gitlab';

describe('sprintAnalyticsUtils', () => {
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
          time_estimate: 7200, // 2 hours in seconds
          total_time_spent: 3600 // 1 hour in seconds
        },
        iteration: {
          title: 'Sprint 1',
          start_date: '2024-01-01T00:00:00Z',
          due_date: '2024-01-14T23:59:59Z',
          id: 1,
          state: 'started'
        }
      },
      {
        id: 2,
        iid: 102,
        title: 'Issue 2',
        description: 'Description 2',
        state: 'opened',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
        labels: [],
        assignees: [mockUsers[1]],
        author: mockUsers[1],
        web_url: 'https://gitlab.com/issue/2',
        time_stats: {
          time_estimate: 14400, // 4 hours in seconds
          total_time_spent: 1800 // 0.5 hours in seconds
        },
        iteration: {
          title: 'Sprint 1',
          start_date: '2024-01-01T00:00:00Z',
          due_date: '2024-01-14T23:59:59Z',
          id: 1,
          state: 'started'
        }
      },
      {
        id: 3,
        iid: 103,
        title: 'Issue 3',
        description: 'Description 3',
        state: 'closed',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
        labels: [],
        assignees: [mockUsers[0]],
        author: mockUsers[0],
        web_url: 'https://gitlab.com/issue/3',
        time_stats: {
          time_estimate: 10800, // 3 hours in seconds
          total_time_spent: 10800 // 3 hours in seconds
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
  });

  describe('calculateVelocityMetrics', () => {
    it('should calculate achieved velocity correctly', () => {
      const timeMetrics = {
        sprintStartDate: '2024-01-01T00:00:00Z',
        sprintEndDate: '2024-01-14T23:59:59Z',
        totalSprintDays: 14,
        elapsedDays: 7,
        remainingDays: 7,
        elapsedPercentage: 50
      };

      const result = calculateVelocityMetrics(mockIssues, timeMetrics);

      expect(result.achievedVelocity).toBe(2 / 7); // 2 completed issues / 7 elapsed days
      expect(result.requiredVelocity).toBe(1 / 7); // 1 remaining issue / 7 remaining days
      expect(result.status).toBe('poor'); // achieved < required
      expect(result.elapsedDays).toBe(7);
      expect(result.remainingDays).toBe(7);
    });

    it('should handle zero elapsed days', () => {
      const timeMetrics = {
        sprintStartDate: '2024-01-01T00:00:00Z',
        sprintEndDate: '2024-01-14T23:59:59Z',
        totalSprintDays: 14,
        elapsedDays: 0,
        remainingDays: 14,
        elapsedPercentage: 0
      };

      const result = calculateVelocityMetrics(mockIssues, timeMetrics);

      expect(result.achievedVelocity).toBe(0);
      expect(result.status).toBe('poor'); // 0 achieved vs required
    });

    it('should handle zero remaining days', () => {
      const timeMetrics = {
        sprintStartDate: '2024-01-01T00:00:00Z',
        sprintEndDate: '2024-01-14T23:59:59Z',
        totalSprintDays: 14,
        elapsedDays: 14,
        remainingDays: 0,
        elapsedPercentage: 100
      };

      const result = calculateVelocityMetrics(mockIssues, timeMetrics);

      expect(result.requiredVelocity).toBe(0);
      expect(result.status).toBe('neutral'); // no remaining days
    });
  });

  describe('calculateTimeMetrics', () => {
    it('should calculate time metrics from iteration with priority over milestone', () => {
      const mockIteration = {
        title: 'Sprint 1',
        start_date: '2024-01-05T00:00:00Z',
        due_date: '2024-01-19T23:59:59Z',
        id: 1,
        state: 'started'
      };

      const result = calculateTimeMetrics(mockMilestone, mockIteration);

      expect(result.totalSprintDays).toBe(15); // From iteration dates
      expect(result.elapsedDays).toBeGreaterThanOrEqual(0);
      expect(result.remainingDays).toBeGreaterThanOrEqual(0);
      expect(result.elapsedPercentage).toBeGreaterThanOrEqual(0);
      expect(result.elapsedPercentage).toBeLessThanOrEqual(100);
    });

    it('should handle missing milestone and iteration with defaults', () => {
      const result = calculateTimeMetrics();

      expect(result.totalSprintDays).toBeGreaterThan(0);
      expect(result.elapsedDays).toBeGreaterThanOrEqual(0);
      expect(result.remainingDays).toBeGreaterThanOrEqual(0);
    });

    it('should fallback to milestone when iteration has no dates', () => {
      const iterationWithoutDates = {
        title: 'Sprint 1',
        id: 1,
        state: 'started'
      };

      const result = calculateTimeMetrics(mockMilestone, iterationWithoutDates);

      expect(result.totalSprintDays).toBe(14); // Should use milestone dates
    });

    it('should use iteration start date and assume 2-week sprint when no end date', () => {
      const iterationWithStartOnly = {
        title: 'Sprint 1',
        start_date: '2024-01-01T00:00:00Z',
        id: 1,
        state: 'started'
      };

      const result = calculateTimeMetrics(undefined, iterationWithStartOnly);

      expect(result.totalSprintDays).toBe(14); // Should assume 14 days
    });

    it('should ensure minimum 1 day for total sprint days', () => {
      const sameDayMilestone = {
        ...mockMilestone,
        start_date: '2024-01-01T00:00:00Z',
        due_date: '2024-01-01T23:59:59Z'
      };

      const result = calculateTimeMetrics(sameDayMilestone);

      expect(result.totalSprintDays).toBe(1);
    });

    it('should prioritize iteration dates over milestone dates', () => {
      const differentIteration = {
        title: 'Sprint 1', 
        start_date: '2024-02-01T00:00:00Z',
        due_date: '2024-02-15T23:59:59Z',
        id: 1,
        state: 'started'
      };

      const result = calculateTimeMetrics(mockMilestone, differentIteration);
      
      // Should use iteration dates (Feb 1-15) not milestone dates (Jan 1-14)
      expect(result.totalSprintDays).toBe(15);
      expect(result.sprintStartDate).toBe('2024-02-01T00:00:00.000Z');
      expect(result.sprintEndDate).toBe('2024-02-15T23:59:59.000Z');
    });
  });

  describe('calculateHourMetrics', () => {
    it('should calculate hour metrics correctly', () => {
      const result = calculateHourMetrics(mockIssues, mockUsers, 14);

      // Total estimated: 2 + 4 + 3 = 9 hours
      expect(result.totalEstimated).toBe(9);
      // Total spent: 1 + 0.5 + 3 = 4.5 hours
      expect(result.totalSpent).toBe(4.5);
      // Sprint capacity: 14 days * 8 hours * 2 users = 224 hours
      expect(result.sprintCapacity).toBe(224);
      // Utilization: (9 / 224) * 100 = ~4.02%
      expect(result.utilizationPercentage).toBeCloseTo(4.0, 1);
      // Progress: (4.5 / 9) * 100 = 50%
      expect(result.progressPercentage).toBe(50);
      // Completion: 2 closed / 3 total = 66.67%
      // Efficiency: |50 - 66.67| = 16.67% > 15% tolerance
      expect(result.efficiency).toBe('poor');
    });

    it('should handle zero estimated hours', () => {
      const issuesWithNoEstimates = mockIssues.map(issue => ({
        ...issue,
        time_stats: { time_estimate: 0, total_time_spent: 0 }
      }));

      const result = calculateHourMetrics(issuesWithNoEstimates, mockUsers, 14);

      expect(result.totalEstimated).toBe(0);
      expect(result.progressPercentage).toBe(0);
      expect(result.efficiency).toBe('neutral');
    });
  });

  describe('calculateSprintMetrics', () => {
    it('should calculate comprehensive sprint metrics', () => {
      const result = calculateSprintMetrics(mockIssues, 'Sprint 1', mockUsers, mockMilestone);

      expect(result.totalIssues).toBe(3);
      expect(result.completedIssues).toBe(2);
      expect(result.completionRate).toBeCloseTo(66.67, 1);
      expect(result.estimatedHours).toBe(9);
      expect(result.spentHours).toBe(4.5);
      expect(result.sprintCapacityHours).toBe(224);
    });

    it('should filter issues by current iteration', () => {
      const issuesWithDifferentIterations = [
        ...mockIssues,
        {
          ...mockIssues[0],
          id: 4,
          iid: 104,
          iteration: { title: 'Sprint 2', id: 2, state: 'started' as const }
        }
      ];

      const result = calculateSprintMetrics(issuesWithDifferentIterations, 'Sprint 1', mockUsers, mockMilestone);

      expect(result.totalIssues).toBe(3); // Should exclude Sprint 2 issue
    });
  });

  describe('status helper functions', () => {
    describe('getCompletionStatus', () => {
      it('should return good when completion >= elapsed percentage', () => {
        expect(getCompletionStatus(60, 50)).toBe('good');
        expect(getCompletionStatus(50, 50)).toBe('good');
      });

      it('should return poor when completion < elapsed percentage', () => {
        expect(getCompletionStatus(40, 50)).toBe('poor');
      });

      it('should return neutral when elapsed percentage is zero', () => {
        expect(getCompletionStatus(50, 0)).toBe('neutral');
      });
    });

    describe('getVelocityStatus', () => {
      it('should return good when achieved >= required', () => {
        expect(getVelocityStatus(2.0, 1.5)).toBe('good');
        expect(getVelocityStatus(1.5, 1.5)).toBe('good');
      });

      it('should return poor when achieved < required', () => {
        expect(getVelocityStatus(1.0, 1.5)).toBe('poor');
      });

      it('should return neutral when required is zero', () => {
        expect(getVelocityStatus(1.0, 0)).toBe('neutral');
      });
    });

    describe('getHourEfficiencyStatus', () => {
      it('should return good when efficiency gap <= 15%', () => {
        expect(getHourEfficiencyStatus(50, 55)).toBe('good'); // 5% gap
        expect(getHourEfficiencyStatus(60, 45)).toBe('good'); // 15% gap
      });

      it('should return poor when efficiency gap > 15%', () => {
        expect(getHourEfficiencyStatus(50, 70)).toBe('poor'); // 20% gap
      });

      it('should return neutral when either percentage is zero', () => {
        expect(getHourEfficiencyStatus(0, 50)).toBe('neutral');
        expect(getHourEfficiencyStatus(50, 0)).toBe('neutral');
      });
    });
  });

  describe('formatting functions', () => {
    describe('formatHours', () => {
      it('should format hours with 1 decimal place', () => {
        expect(formatHours(2.5)).toBe('2.5h');
        expect(formatHours(10)).toBe('10h');
        expect(formatHours(1.234)).toBe('1.2h');
      });
    });

    describe('formatVelocity', () => {
      it('should format velocity with 1 decimal place', () => {
        expect(formatVelocity(1.5)).toBe('1.5 issues/day');
        expect(formatVelocity(2)).toBe('2 issues/day');
        expect(formatVelocity(0.333)).toBe('0.3 issues/day');
      });
    });

    describe('formatPercentage', () => {
      it('should format percentage as whole number', () => {
        expect(formatPercentage(66.67)).toBe('67%');
        expect(formatPercentage(50)).toBe('50%');
        expect(formatPercentage(33.33)).toBe('33%');
      });
    });

    describe('formatDays', () => {
      it('should format days correctly', () => {
        expect(formatDays(1)).toBe('1 day');
        expect(formatDays(2)).toBe('2 days');
        expect(formatDays(0)).toBe('0 days');
        expect(formatDays(10)).toBe('10 days');
      });
    });
    
    describe('calculateSprintCapacity', () => {
      it('should calculate sprint capacity breakdown correctly', () => {
        const result = calculateSprintCapacity(mockUsers, 14, 8);
    
        expect(result.teamMemberCount).toBe(2);
        expect(result.workingHoursPerDay).toBe(8);
        expect(result.dailyCapacity).toBe(16); // 2 users * 8 hours
        expect(result.totalTeamCapacity).toBe(224); // 16 hours/day * 14 days
        expect(result.sprintDuration).toBe(14);
      });
    
      it('should handle empty user array', () => {
        const result = calculateSprintCapacity([], 14, 8);
    
        expect(result.teamMemberCount).toBe(0);
        expect(result.dailyCapacity).toBe(0);
        expect(result.totalTeamCapacity).toBe(0);
      });
    
      it('should handle custom working hours', () => {
        const result = calculateSprintCapacity(mockUsers, 10, 6);
    
        expect(result.workingHoursPerDay).toBe(6);
        expect(result.dailyCapacity).toBe(12); // 2 users * 6 hours
        expect(result.totalTeamCapacity).toBe(120); // 12 hours/day * 10 days
      });
    });
  });
});