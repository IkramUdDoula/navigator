import { GitLabIssue, GitLabUser, UserMetrics, ProjectMetrics } from '@/types/gitlab';

// Additional interfaces for team metrics
interface SprintMetrics {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalIssues: number;
  completedIssues: number;
  velocity: number;
  completionRate: number;
}

interface WorkloadMetrics {
  userId: number;
  userName: string;
  totalTasks: number;
  byProject: Record<string, number>;
  bySprint: Record<string, number>;
  byPriority: Record<string, number>;
}

interface CompletionMetrics {
  userId: number;
  userName: string;
  completionRate: number;
  avgTimeToClose: number;
  reopenRate: number;
}

interface Alert {
  userId: number;
  userName: string;
  type: 'behind-schedule' | 'overloaded' | 'high-performing';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Calculate user metrics from issues and users
 */
export function calculateUserMetrics(issues: GitLabIssue[], users: GitLabUser[]): UserMetrics[] {
  return users.map(user => {
    const userIssues = issues.filter(issue => 
      issue.assignees.some(assignee => assignee.id === user.id)
    );
    
    const totalIssues = userIssues.length;
    const inProgressIssues = userIssues.filter(issue => 
      issue.state === 'opened' && 
      issue.labels.some(label => 
        label.toLowerCase().includes('in progress') || 
        label.toLowerCase().includes('in-progress')
      )
    ).length;
    
    const completedIssues = userIssues.filter(issue => issue.state === 'closed').length;
    const pendingIssues = userIssues.filter(issue => 
      issue.state === 'opened' && 
      !issue.labels.some(label => 
        label.toLowerCase().includes('in progress') || 
        label.toLowerCase().includes('in-progress')
      )
    ).length;
    
    // Calculate overdue issues (simplified)
    const overdueIssues = userIssues.filter(issue => {
      if (issue.state === 'closed') return false;
      if (!issue.milestone?.due_date) return false;
      
      const dueDate = new Date(issue.milestone.due_date);
      return dueDate < new Date();
    }).length;
    
    // Calculate total estimated hours
    const totalEstimatedHours = userIssues.reduce((total, issue) => {
      // Convert time_estimate from seconds to hours and add to total
      const estimateInHours = issue.time_stats?.time_estimate
        ? issue.time_stats.time_estimate / 3600  // Convert seconds to hours
        : 0;
      return total + estimateInHours;
    }, 0);
    
    const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
    
    // Calculate average time to close issues (in days)
    let totalTimeToClose = 0;
    let closedIssuesWithDates = 0;
    
    userIssues.forEach(issue => {
      if (issue.state === 'closed' && issue.created_at && issue.updated_at) {
        const createdDate = new Date(issue.created_at);
        const closedDate = new Date(issue.updated_at);
        const timeToClose = (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        totalTimeToClose += timeToClose;
        closedIssuesWithDates++;
      }
    });
    
    const avgTimeToClose = closedIssuesWithDates > 0 ? totalTimeToClose / closedIssuesWithDates : 0;
    
    // Calculate reopen rate (simplified - assuming reopened issues have specific labels)
    const reopenedIssues = userIssues.filter(issue => 
      issue.labels.some(label => 
        label.toLowerCase().includes('reopened') || 
        label.toLowerCase().includes('re-opened')
      )
    ).length;
    
    const reopenRate = totalIssues > 0 ? (reopenedIssues / totalIssues) * 100 : 0;
    
    // Determine workload classification
    let workload: 'low' | 'medium' | 'high' = 'low';
    if (pendingIssues > 10) workload = 'high';
    else if (pendingIssues > 5) workload = 'medium';
    
    // Determine performance classification
    let performance: 'underperforming' | 'normal' | 'overloaded' | 'high-performing' = 'normal';
    if (completionRate < 50) performance = 'underperforming';
    else if (completionRate > 90 && pendingIssues > 10) performance = 'overloaded';
    else if (completionRate > 90) performance = 'high-performing';
    
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatar_url,
      role: 'Developer', // This would come from user data in a real implementation
      projects: [], // This would be populated with actual project data
      activeSprints: [], // This would be populated with actual sprint data
      totalIssues,
      inProgressIssues,
      completedIssues,
      pendingIssues,
      overdueIssues,
      totalEstimatedHours: Number(totalEstimatedHours.toFixed(1)),
      completionRate,
      avgTimeToClose,
      reopenRate,
      workload,
      performance
    };
  });
}

/**
 * Calculate project metrics from issues
 */
export function calculateProjectMetrics(issues: GitLabIssue[]): ProjectMetrics[] {
  // In a real implementation, we would extract project information from issues
  // For now, we'll create a simplified representation
  const projects: Record<string, ProjectMetrics> = {};
  
  issues.forEach(issue => {
    // Extract project information from issue (this is simplified)
    const projectName = issue.web_url ? new URL(issue.web_url).pathname.split('/')[2] : 'Unknown Project';
    
    if (!projects[projectName]) {
      projects[projectName] = {
        id: projectName, // Using name as ID for simplicity
        name: projectName,
        totalIssues: 0,
        inProgressIssues: 0,
        completedIssues: 0,
        pendingIssues: 0,
        overdueIssues: 0,
        completionRate: 0
      };
    }
    
    projects[projectName].totalIssues++;
    
    if (issue.state === 'closed') {
      projects[projectName].completedIssues++;
    } else if (issue.labels.some(label => 
      label.toLowerCase().includes('in progress') || 
      label.toLowerCase().includes('in-progress'))) {
      projects[projectName].inProgressIssues++;
    } else {
      projects[projectName].pendingIssues++;
    }
    
    // Check if overdue
    if (issue.state === 'opened' && issue.milestone?.due_date) {
      const dueDate = new Date(issue.milestone.due_date);
      if (dueDate < new Date()) {
        projects[projectName].overdueIssues++;
      }
    }
  });
  
  // Calculate completion rates
  Object.values(projects).forEach(project => {
    project.completionRate = project.totalIssues > 0 ? 
      (project.completedIssues / project.totalIssues) * 100 : 0;
  });
  
  return Object.values(projects);
}

/**
 * Calculate sprint metrics from issues
 */
export function calculateSprintMetrics(issues: GitLabIssue[]): SprintMetrics[] {
  const sprints: Record<string, SprintMetrics> = {};
  
  issues.forEach(issue => {
    if (issue.milestone) {
      const sprintName = issue.milestone.title;
      
      if (!sprints[sprintName]) {
        sprints[sprintName] = {
          id: sprintName, // Using name as ID for simplicity
          name: sprintName,
          startDate: issue.milestone.start_date || '',
          endDate: issue.milestone.due_date || '',
          totalIssues: 0,
          completedIssues: 0,
          velocity: 0,
          completionRate: 0
        };
      }
      
      sprints[sprintName].totalIssues++;
      
      if (issue.state === 'closed') {
        sprints[sprintName].completedIssues++;
      }
    }
  });
  
  // Calculate completion rates and velocity
  Object.values(sprints).forEach(sprint => {
    sprint.completionRate = sprint.totalIssues > 0 ? 
      (sprint.completedIssues / sprint.totalIssues) * 100 : 0;
    
    // Velocity is simplified as completed issues
    sprint.velocity = sprint.completedIssues;
  });
  
  return Object.values(sprints);
}

/**
 * Calculate workload metrics from issues and users
 */
export function calculateWorkloadMetrics(issues: GitLabIssue[], users: GitLabUser[]): WorkloadMetrics[] {
  return users.map(user => {
    const userIssues = issues.filter(issue => 
      issue.assignees.some(assignee => assignee.id === user.id)
    );
    
    // Group issues by project (simplified)
    const issuesByProject: Record<string, number> = {};
    const issuesBySprint: Record<string, number> = {};
    const issuesByPriority: Record<string, number> = {};
    
    userIssues.forEach(issue => {
      // Project grouping (simplified)
      const projectName = issue.web_url ? new URL(issue.web_url).pathname.split('/')[2] : 'Unknown Project';
      issuesByProject[projectName] = (issuesByProject[projectName] || 0) + 1;
      
      // Sprint grouping
      if (issue.milestone) {
        issuesBySprint[issue.milestone.title] = (issuesBySprint[issue.milestone.title] || 0) + 1;
      }
      
      // Priority grouping (simplified - looking for priority labels)
      const priorityLabels = issue.labels.filter(label => 
        label.toLowerCase().includes('priority') || 
        label.toLowerCase().includes('high') || 
        label.toLowerCase().includes('medium') || 
        label.toLowerCase().includes('low')
      );
      
      if (priorityLabels.length > 0) {
        issuesByPriority[priorityLabels[0]] = (issuesByPriority[priorityLabels[0]] || 0) + 1;
      } else {
        issuesByPriority['unspecified'] = (issuesByPriority['unspecified'] || 0) + 1;
      }
    });
    
    return {
      userId: user.id,
      userName: user.name,
      totalTasks: userIssues.length,
      byProject: issuesByProject,
      bySprint: issuesBySprint,
      byPriority: issuesByPriority
    };
  });
}

/**
 * Calculate completion metrics from issues and users
 */
export function calculateCompletionMetrics(issues: GitLabIssue[], users: GitLabUser[]): CompletionMetrics[] {
  return users.map(user => {
    const userIssues = issues.filter(issue => 
      issue.assignees.some(assignee => assignee.id === user.id)
    );
    
    const totalIssues = userIssues.length;
    const completedIssues = userIssues.filter(issue => issue.state === 'closed').length;
    
    const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
    
    // Calculate average time to close issues (in days)
    let totalTimeToClose = 0;
    let closedIssuesWithDates = 0;
    
    userIssues.forEach(issue => {
      if (issue.state === 'closed' && issue.created_at && issue.updated_at) {
        const createdDate = new Date(issue.created_at);
        const closedDate = new Date(issue.updated_at);
        const timeToClose = (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        totalTimeToClose += timeToClose;
        closedIssuesWithDates++;
      }
    });
    
    const avgTimeToClose = closedIssuesWithDates > 0 ? totalTimeToClose / closedIssuesWithDates : 0;
    
    // Calculate reopen rate
    const reopenedIssues = userIssues.filter(issue => 
      issue.labels.some(label => 
        label.toLowerCase().includes('reopened') || 
        label.toLowerCase().includes('re-opened')
      )
    ).length;
    
    const reopenRate = totalIssues > 0 ? (reopenedIssues / totalIssues) * 100 : 0;
    
    return {
      userId: user.id,
      userName: user.name,
      completionRate,
      avgTimeToClose,
      reopenRate
    };
  });
}

/**
 * Generate alerts based on user metrics
 */
export function generateAlerts(userMetrics: UserMetrics[]): Alert[] {
  const alerts: Alert[] = [];
  
  userMetrics.forEach(user => {
    // Alert for users behind schedule (low completion rate with many pending issues)
    if (user.completionRate < 50 && user.pendingIssues > 5) {
      alerts.push({
        userId: user.id,
        userName: user.name,
        type: 'behind-schedule',
        message: `${user.name} has a low completion rate (${user.completionRate.toFixed(1)}%) with ${user.pendingIssues} pending issues`,
        severity: 'high'
      });
    }
    
    // Alert for overloaded users (high workload)
    if (user.workload === 'high') {
      alerts.push({
        userId: user.id,
        userName: user.name,
        type: 'overloaded',
        message: `${user.name} has a high workload with ${user.pendingIssues} pending issues`,
        severity: 'medium'
      });
    }
    
    // Recognition for high-performing users
    if (user.performance === 'high-performing') {
      alerts.push({
        userId: user.id,
        userName: user.name,
        type: 'high-performing',
        message: `${user.name} is high-performing with a ${user.completionRate.toFixed(1)}% completion rate`,
        severity: 'low'
      });
    }
  });
  
  return alerts;
}