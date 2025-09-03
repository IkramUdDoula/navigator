import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Calendar, User } from 'lucide-react';

export interface GitLabCredentials {
  host: string;
  token: string;
  groupId: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: 'opened' | 'closed';
  created_at: string;
  updated_at: string;
  labels: string[];
  assignees: GitLabUser[];
  author: GitLabUser;
  milestone?: GitLabMilestone;
  web_url: string;
  // Extended fields for time tracking
  time_stats?: {
    time_estimate: number;
    total_time_spent: number;
  };
  // Extended fields for iteration support
  iteration?: {
    title: string;
    start_date?: string;
    due_date?: string;
    id: number;
    state: 'opened' | 'upcoming' | 'started' | 'closed';
  };
  epic?: {
    title: string;
    name?: string;
    id?: number;
  };
  parent?: {
    title: string;
    iid?: number;
  };
  // Enhanced status field
  resolved_status?: ResolvedStatus;
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
}

export interface GitLabMilestone {
  id: number;
  title: string;
  state: 'active' | 'closed' | 'upcoming' | 'started';
  start_date?: string;
  due_date?: string;
  description?: string;
}

export interface GitLabIteration {
  id: number;
  title: string;
  state: 'opened' | 'upcoming' | 'started' | 'closed';
  start_date?: string;
  due_date?: string;
  description?: string;
}

export interface GitLabBoard {
  id: number;
  name: string;
  lists: GitLabBoardList[];
}

export interface GitLabBoardList {
  id: number;
  label: {
    id: number;
    name: string;
    color: string;
  } | null;
  position: number;
}

// Enhanced Status Resolution Types
export interface ResolvedStatus {
  name: string;
  source: 'label' | 'state';
  category: 'opened' | 'closed';
  color?: string;
  originalLabel?: string;
}

export interface GitLabLabel {
  id: string;
  title: string;
  color: string;
  description: string;
  text_color?: string;
}

// Project interface for issue creation
export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  default_branch: string;
  visibility: string;
  web_url: string;
}

// Create Issue Request interface
export interface CreateIssueRequest {
  projectId: number;
  title: string;
  description?: string;
  assignee_ids?: number[];
  milestone_id?: number;
  labels?: string[];
  weight?: number;
  time_estimate?: number;
  state_event?: 'close' | 'reopen';
}

// Form data interface for the create issue form
export interface CreateIssueFormData {
  title: string;
  description: string;
  projectId: number | null;
  assigneeIds: number[];
  labels: string[];
  timeEstimate: number | null;
}

export interface StatusLabelData {
  statusLabels: GitLabLabel[];
  colorMapping: Record<string, string>;
}

// Status Badge Props Interface
export interface StatusBadgeProps {
  status: string;
  variant: 'opened' | 'closed' | 'status';
  color?: string;
  className?: string;
}

// Grouping data structures
export interface GroupedIssueData {
  issues: GitLabIssue[];
  estimate: number;
  spent: number;
  count: number;
}

export type IterationAssigneeGrouping = {
  [iterationTitle: string]: {
    [assigneeName: string]: GroupedIssueData;
  }
};

export type IterationStatusAssigneeGrouping = {
  [iterationTitle: string]: {
    [status: string]: {
      [assigneeName: string]: GroupedIssueData;
    }
  }
};

export type IterationEpicAssigneeGrouping = {
  [iterationTitle: string]: {
    [epicTitle: string]: {
      [assigneeName: string]: GroupedIssueData;
    }
  }
};

export type EpicAssigneeGrouping = {
  [epicTitle: string]: {
    [assigneeName: string]: GroupedIssueData;
  }
};

export type StatusAssigneeGrouping = {
  [status: string]: {
    [assigneeName: string]: GroupedIssueData;
  }
};

// Iteration → Epic grouping (without assignee)
export type IterationEpicGrouping = {
  [iterationTitle: string]: {
    [epicTitle: string]: GitLabIssue[];
  }
};

// New single-level grouping data structures
export type IterationGrouping = {
  [iterationTitle: string]: GitLabIssue[];
};

export type StatusGrouping = {
  [status: string]: GitLabIssue[];
};

export type EpicGrouping = {
  [epicTitle: string]: GitLabIssue[];
};

export type AssigneeGrouping = {
  [assigneeName: string]: GitLabIssue[];
};

export type GroupingType = 
  | 'iteration' // New single-level grouping
  | 'status' // New single-level grouping
  | 'epic' // New single-level grouping
  | 'assignee' // New single-level grouping
  | 'iteration-assignee'
  | 'iteration-status-assignee'
  | 'iteration-epic'
  | 'iteration-epic-assignee'
  | 'epic-assignee'
  | 'status-assignee';

// Extended types for team performance and sprint review
export interface UserStats extends GitLabUser {
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  completionRate: number;
  recentIssues: GitLabIssue[];
  productivity?: number;
  workload?: 'low' | 'medium' | 'high';
  trend?: 'up' | 'down' | 'stable';
  // New fields for team performance metrics
  cycleTime?: number; // Average time to close issues (in days)
  blockedTime?: number; // Total time spent in blocked state (in days)
  storyPointsCompleted?: number; // Total story points completed
}

export interface TeamViewProps {
  issues: GitLabIssue[];
  users: GitLabUser[];
  isLoading: boolean;
}

// New types for the TeamTab component
export interface UserMetrics {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
  role: string;
  projects: string[];
  activeSprints: string[];
  totalIssues: number;
  inProgressIssues: number;
  completedIssues: number;
  pendingIssues: number;
  overdueIssues: number;
  totalEstimatedHours: number;
  completionRate: number;
  avgTimeToClose: number;
  reopenRate: number;
  workload: 'low' | 'medium' | 'high';
  performance: 'underperforming' | 'normal' | 'overloaded' | 'high-performing';
}

export interface ProjectMetrics {
  id: string;
  name: string;
  totalIssues: number;
  inProgressIssues: number;
  completedIssues: number;
  pendingIssues: number;
  overdueIssues: number;
  completionRate: number;
}

// Analytics data structures
export interface AnalyticsMetrics {
  velocity: VelocityMetrics;
  pipeline: PipelineMetrics;
  codeReview: CodeReviewMetrics;
  valueStream: ValueStreamMetrics;
}

export interface VelocityMetrics {
  sprintVelocity: {
    sprintName: string;
    storyPoints: number;
    issueCount: number;
  }[];
  cycleTime: {
    date: string;
    averageHours: number;
  }[];
  leadTime: {
    date: string;
    averageHours: number;
  }[];
  burndown: {
    date: string;
    remainingWork: number;
    idealWork: number;
  }[];
}

export interface PipelineMetrics {
  successRate: number;
  failureRate: number;
  averageDuration: number;
  deploymentFrequency: {
    date: string;
    count: number;
  }[];
  changeFailureRate: number;
  pipelineHistory: {
    id: number;
    status: 'success' | 'failed' | 'running';
    duration: number;
    startTime: string;
  }[];
}

export interface CodeReviewMetrics {
  averageReviewTime: number;
  reviewsPerDeveloper: {
    userId: number;
    userName: string;
    reviewCount: number;
  }[];
  testCoverage: number;
  bugReports: {
    date: string;
    count: number;
  }[];
}

export interface ValueStreamMetrics {
  stageFlow: {
    stage: string;
    count: number;
    averageTimeHours: number;
  }[];
  bottlenecks: {
    stage: string;
    averageTimeHours: number;
    percentageOfTotal: number;
  }[];
}

// Sprint Analytics Types
export interface SprintMetrics {
  totalIssues: number;
  completedIssues: number;
  completionRate: number;
  timeRemaining: number;
  achievedVelocity: number;
  requiredVelocity: number;
  estimatedHours: number;
  spentHours: number;
  sprintCapacityHours: number;
}

export interface SprintVelocityMetrics {
  achievedVelocity: number;
  requiredVelocity: number;
  elapsedDays: number;
  remainingDays: number;
  status: 'good' | 'poor' | 'neutral';
  // Enhanced capacity breakdown
  capacityBreakdown: {
    totalTeamCapacity: number;
    dailyCapacity: number;
    utilizationPercentage: number;
    teamMemberCount: number;
    workingHoursPerDay: number;
  };
}

export interface SprintTimeMetrics {
  sprintStartDate: string;
  sprintEndDate: string;
  totalSprintDays: number;
  elapsedDays: number;
  remainingDays: number;
  elapsedPercentage: number;
}

export interface SprintHourMetrics {
  totalEstimated: number;
  totalSpent: number;
  sprintCapacity: number;
  utilizationPercentage: number;
  progressPercentage: number;
  efficiency: 'good' | 'poor' | 'neutral';
}

export interface MetricCardProps {
  title: string;
  primaryValue: string | number;
  subtext: string;
  statusIndicator?: 'good' | 'poor' | 'neutral';
  comparisonValue?: string;
  className?: string;
}