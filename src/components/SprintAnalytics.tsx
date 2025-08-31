import React, { useMemo } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { 
  GitLabIssue, 
  GitLabUser, 
  GitLabMilestone 
} from '@/types/gitlab';
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
} from '@/lib/sprintAnalyticsUtils';
import { cn } from '@/lib/utils';

interface SprintAnalyticsProps {
  issues: GitLabIssue[];
  users?: GitLabUser[] | null;
  className?: string;
}

export function SprintAnalytics({ 
  issues, 
  users, 
  className 
}: SprintAnalyticsProps) {
  const sprintMetrics = useMemo(() => {
    if (!issues.length) {
      return null;
    }
    
    return calculateSprintMetrics(issues, users || [], undefined);
  }, [issues, users]);

  const timeMetrics = useMemo(() => {
    // Get iteration data from the first issue that has it
    const currentIterationData = issues.find(issue => 
      issue.iteration
    )?.iteration;
    
    return calculateTimeMetrics(undefined, currentIterationData);
  }, [issues]);

  const velocityMetrics = useMemo(() => {
    if (!issues.length) {
      return null;
    }
    
    return calculateVelocityMetrics(issues, timeMetrics, users || []);
  }, [issues, timeMetrics, users]);

  const hourMetrics = useMemo(() => {
    if (!issues.length) {
      return null;
    }
    
    return calculateHourMetrics(issues, users || [], timeMetrics.totalSprintDays);
  }, [issues, users, timeMetrics]);

  if (!sprintMetrics || !velocityMetrics || !hourMetrics) {
    return (
      <div className={cn("p-6", className)}>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No sprint data available
          </h3>
          <p className="text-sm text-muted-foreground">
            Sprint metrics will appear when issues and iterations are available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Sprint Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprint Analytics</h2>
          <p className="text-muted-foreground">
            Real-time metrics for current sprint
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 1. Total Issues */}
        <MetricCard
          title="Total Issues"
          primaryValue={sprintMetrics.totalIssues}
          subtext="All issues planned in this sprint"
        />

        {/* 2. Completed Issues */}
        <MetricCard
          title="Completed"
          primaryValue={sprintMetrics.completedIssues}
          subtext={`of ${sprintMetrics.totalIssues}`}
          statusIndicator={getCompletionStatus(
            sprintMetrics.completionRate, 
            timeMetrics.elapsedPercentage
          )}
        />

        {/* 3. Completion Rate */}
        <MetricCard
          title="Completion Rate"
          primaryValue={formatPercentage(sprintMetrics.completionRate)}
          subtext="Percent of total issues completed"
          statusIndicator={getCompletionStatus(
            sprintMetrics.completionRate, 
            timeMetrics.elapsedPercentage
          )}
        />

        {/* 4. Time Remaining */}
        <MetricCard
          title="Time Remaining"
          primaryValue={formatDays(timeMetrics.remainingDays)}
          subtext="Days left in sprint"
        />

        {/* 5. Velocity - Simple version */}
        <MetricCard
          title="Velocity"
          primaryValue={formatVelocity(velocityMetrics.achievedVelocity)}
          subtext={`Need ${formatVelocity(velocityMetrics.requiredVelocity)}`}
          statusIndicator={velocityMetrics.status}
        />

        {/* 6. Estimated Hours - Simple version */}
        <MetricCard
          title="Estimated Hours"
          primaryValue={formatHours(hourMetrics.totalEstimated)}
          subtext="Total estimation"
        />

        {/* 7. Progress Hours */}
        <MetricCard
          title="Progress Hours"
          primaryValue={formatHours(hourMetrics.totalSpent)}
          subtext="Time spent"
          comparisonValue={`${formatPercentage(hourMetrics.progressPercentage)} of estimated`}
          statusIndicator={hourMetrics.efficiency}
        />
      </div>
    </div>
  );
}