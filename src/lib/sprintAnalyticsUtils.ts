import { 
  GitLabIssue, 
  GitLabUser, 
  GitLabMilestone,
  SprintMetrics, 
  SprintVelocityMetrics, 
  SprintTimeMetrics, 
  SprintHourMetrics 
} from '@/types/gitlab';

/**
 * Utility functions for calculating sprint analytics metrics
 */

/**
 * Calculate comprehensive sprint metrics using iteration-based time calculations
 */
export function calculateSprintMetrics(
  issues: GitLabIssue[], 
  users: GitLabUser[],
  milestone?: GitLabMilestone
): SprintMetrics {
  // Use all issues since filtering is now handled globally
  const sprintIssues = issues;

  const totalIssues = sprintIssues.length;
  const completedIssues = sprintIssues.filter(issue => issue.state === 'closed').length;
  const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;

  // Get iteration data from the first issue that has it
  const currentIterationData = sprintIssues.find(issue => 
    issue.iteration
  )?.iteration;

  // Calculate time metrics using iteration data with milestone as fallback
  const timeMetrics = calculateTimeMetrics(milestone, currentIterationData);
  
  // Calculate velocity metrics
  const velocityMetrics = calculateVelocityMetrics(sprintIssues, timeMetrics, users || []);
  
  // Calculate hour metrics
  const hourMetrics = calculateHourMetrics(sprintIssues, users || [], timeMetrics.totalSprintDays, timeMetrics.elapsedPercentage);

  return {
    totalIssues,
    completedIssues,
    completionRate,
    timeRemaining: timeMetrics.remainingDays,
    achievedVelocity: velocityMetrics.achievedVelocity,
    requiredVelocity: velocityMetrics.requiredVelocity,
    estimatedHours: hourMetrics.totalEstimated,
    spentHours: hourMetrics.totalSpent,
    sprintCapacityHours: hourMetrics.sprintCapacity
  };
}

/**
 * Calculate sprint capacity with team bandwidth breakdown
 */
export function calculateSprintCapacity(
  users: GitLabUser[], 
  sprintDuration: number,
  workingHoursPerDay: number = 8
) {
  console.log('🏃 [SPRINT CAPACITY] Starting calculation...', {
    userCount: users ? users.length : 0,
    sprintDuration,
    workingHoursPerDay
  });

  const teamMemberCount = users ? users.length : 0;
  const dailyCapacity = teamMemberCount * workingHoursPerDay;
  const totalTeamCapacity = dailyCapacity * sprintDuration;

  const result = {
    totalTeamCapacity,
    dailyCapacity,
    teamMemberCount,
    workingHoursPerDay,
    sprintDuration
  };

  console.log('📊 [SPRINT CAPACITY] Calculated breakdown:', result);
  return result;
}
/**
 * Calculate velocity metrics with enhanced capacity breakdown
 */
export function calculateVelocityMetrics(
  issues: GitLabIssue[], 
  timeMetrics: SprintTimeMetrics,
  users: GitLabUser[] = []
): SprintVelocityMetrics {
  console.log('🚀 [VELOCITY METRICS] Starting calculation...', {
    issueCount: issues.length,
    elapsedDays: timeMetrics.elapsedDays,
    remainingDays: timeMetrics.remainingDays,
    userCount: users ? users.length : 0
  });

  const completedIssues = issues.filter(i => i.state === 'closed').length;
  const totalIssues = issues.length;
  const remainingIssues = totalIssues - completedIssues;
  
  const achievedVelocity = timeMetrics.elapsedDays > 0 
    ? completedIssues / timeMetrics.elapsedDays 
    : 0;
    
  const requiredVelocity = timeMetrics.remainingDays > 0 
    ? remainingIssues / timeMetrics.remainingDays 
    : 0;
    
  let status: 'good' | 'poor' | 'neutral' = 'neutral';
  if (timeMetrics.remainingDays > 0) {
    status = achievedVelocity >= requiredVelocity ? 'good' : 'poor';
  }

  // Calculate sprint capacity breakdown
  const sprintCapacity = calculateSprintCapacity(users || [], timeMetrics.totalSprintDays);
  
  // Calculate total estimated hours for utilization
  const totalEstimatedHours = issues.reduce((sum, issue) => {
    const estimate = issue.time_stats?.time_estimate || 0;
    return sum + (estimate / 3600); // Convert seconds to hours
  }, 0);

  const utilizationPercentage = sprintCapacity.totalTeamCapacity > 0 
    ? (totalEstimatedHours / sprintCapacity.totalTeamCapacity) * 100 
    : 0;

  const capacityBreakdown = {
    totalTeamCapacity: sprintCapacity.totalTeamCapacity,
    dailyCapacity: sprintCapacity.dailyCapacity,
    utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
    teamMemberCount: sprintCapacity.teamMemberCount,
    workingHoursPerDay: sprintCapacity.workingHoursPerDay
  };

  const result = {
    achievedVelocity,
    requiredVelocity,
    elapsedDays: timeMetrics.elapsedDays,
    remainingDays: timeMetrics.remainingDays,
    status,
    capacityBreakdown
  };

  console.log('💯 [VELOCITY METRICS] Final result:', result);
  return result;
}

/**
 * Calculate time-based sprint metrics using iteration dates with fallback to milestone
 */
export function calculateTimeMetrics(milestone?: GitLabMilestone, iteration?: { title: string; start_date?: string; due_date?: string; id: number; state: string }): SprintTimeMetrics {
  const now = new Date();
  
  // Priority: 1) Use iteration dates if available, 2) Fall back to milestone dates, 3) Default to 2-week sprint
  let startDate: Date;
  let endDate: Date;
  
  if (iteration?.start_date && iteration?.due_date) {
    // Use iteration dates (highest priority)
    startDate = new Date(iteration.start_date);
    endDate = new Date(iteration.due_date);
  } else if (milestone?.start_date && milestone?.due_date) {
    // Fall back to milestone dates
    startDate = new Date(milestone.start_date);
    endDate = new Date(milestone.due_date);
  } else if (iteration?.start_date) {
    // If only iteration start date, assume 2-week sprint
    startDate = new Date(iteration.start_date);
    endDate = new Date(startDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // Add 14 days
  } else if (milestone?.start_date) {
    // If only milestone start date, assume 2-week sprint
    startDate = new Date(milestone.start_date);
    endDate = new Date(startDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // Add 14 days
  } else {
    // Default: assume we're in the middle of a 2-week sprint
    startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
    endDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
  }
  
  // Set end date to end of day (23:59:59) to include the last day
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Set start date to beginning of day (00:00:00)
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Calculate days including both start and end dates
  const totalSprintDays = Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const elapsedPercentage = totalSprintDays > 0 ? (elapsedDays / totalSprintDays) * 100 : 0;
  
  return {
    sprintStartDate: startOfDay.toISOString(),
    sprintEndDate: endOfDay.toISOString(),
    totalSprintDays: Math.max(1, totalSprintDays), // Ensure at least 1 day
    elapsedDays,
    remainingDays,
    elapsedPercentage
  };
}

/**
 * Calculate hour-based metrics for time tracking
 */
export function calculateHourMetrics(
  issues: GitLabIssue[], 
  users: GitLabUser[], 
  sprintDuration: number,
  elapsedPercentage: number = 0
): SprintHourMetrics {
  // Calculate total estimated hours from issues (convert seconds to hours)
  const totalEstimated = issues.reduce((sum, issue) => {
    const estimate = issue.time_stats?.time_estimate || 0;
    return sum + (estimate / 3600); // Convert seconds to hours
  }, 0);
    
  // Calculate total spent hours from issues (convert seconds to hours)
  const totalSpent = issues.reduce((sum, issue) => {
    const spent = issue.time_stats?.total_time_spent || 0;
    return sum + (spent / 3600); // Convert seconds to hours
  }, 0);
    
  // Calculate sprint capacity (8 hours per day per user)
  const sprintCapacity = sprintDuration * 8 * (users ? users.length : 0);
  
  // Calculate utilization percentage
  const utilizationPercentage = sprintCapacity > 0 
    ? (totalEstimated / sprintCapacity) * 100 
    : 0;
    
  // Calculate progress percentage based on hours
  const progressPercentage = totalEstimated > 0 
    ? (totalSpent / totalEstimated) * 100 
    : 0;
    
  // Calculate completion percentage based on issues
  const completionPercentage = issues.length > 0 
    ? (issues.filter(i => i.state === 'closed').length / issues.length) * 100 
    : 0;
  
  // Determine efficiency status based on relation to sprint time progress
  let efficiency: 'good' | 'poor' | 'neutral' = 'neutral';
  if (totalEstimated > 0 && elapsedPercentage > 0) {
    // Compare progress percentage with elapsed percentage of sprint
    efficiency = progressPercentage >= elapsedPercentage ? 'good' : 'poor';
  }
    
  return {
    totalEstimated: Math.round(totalEstimated * 10) / 10, // Round to 1 decimal
    totalSpent: Math.round(totalSpent * 10) / 10,
    sprintCapacity: Math.round(sprintCapacity * 10) / 10,
    utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
    efficiency
  };
}

/**
 * Status indicator helper functions
 */
export function getCompletionStatus(completionRate: number, elapsedPercentage: number): 'good' | 'poor' | 'neutral' {
  if (elapsedPercentage === 0) return 'neutral';
  return completionRate >= elapsedPercentage ? 'good' : 'poor';
}

export function getVelocityStatus(achieved: number, required: number): 'good' | 'poor' | 'neutral' {
  if (required === 0) return 'neutral';
  return achieved >= required ? 'good' : 'poor';
}

export function getHourEfficiencyStatus(spentPercentage: number, completionPercentage: number): 'good' | 'poor' | 'neutral' {
  if (completionPercentage === 0 || spentPercentage === 0) return 'neutral';
  const efficiency = Math.abs(spentPercentage - completionPercentage);
  return efficiency <= 15 ? 'good' : 'poor'; // 15% tolerance
}

/**
 * Format display values for metrics
 */
export function formatHours(hours: number): string {
  return `${Math.round(hours * 10) / 10}h`;
}

export function formatVelocity(velocity: number): string {
  return `${Math.round(velocity * 10) / 10} issues/day`;
}

export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

export function formatDays(days: number): string {
  if (days === 1) return '1 day';
  return `${days} days`;
}