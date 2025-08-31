import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';
import { SprintAnalytics } from './SprintAnalytics';
import { GitLabIssue, GitLabCredentials } from '@/types/gitlab';
import { StatusBadge } from './StatusBadge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGitLabUsers } from '@/hooks/useGitLabAPI';
import { cn } from '@/lib/utils';

interface IterationKanbanBoardProps {
  issues: GitLabIssue[];
  onIssueClick?: (issue: GitLabIssue) => void;
  className?: string;
}

interface StatusColumn {
  name: string;
  displayName: string;
  issues: GitLabIssue[];
}

export function IterationKanbanBoard({ 
  issues, 
  onIssueClick, 
  className 
}: IterationKanbanBoardProps) {
  
  // Get credentials for basic functionality
  const [credentials] = useLocalStorage<GitLabCredentials | null>('gitlab-credentials', null);
  
  // Fetch users for sprint analytics
  const { data: users = [] } = useGitLabUsers(credentials);
  
  // Get the current iteration - intelligently determine the most relevant current iteration
  const currentIteration = useMemo(() => {
    // Get all unique iterations from issues with their metadata
    const iterationsMap = new Map<string, {
      title: string;
      start_date?: string;
      due_date?: string;
      state: string;
      issueCount: number;
    }>();

    issues.forEach(issue => {
      if (issue.iteration?.title) {
        const existing = iterationsMap.get(issue.iteration.title);
        iterationsMap.set(issue.iteration.title, {
          title: issue.iteration.title,
          start_date: issue.iteration.start_date,
          due_date: issue.iteration.due_date,
          state: issue.iteration.state,
          issueCount: (existing?.issueCount || 0) + 1
        });
      }
    });

    if (iterationsMap.size === 0) {
      return null;
    }

    const now = new Date();
    const iterations = Array.from(iterationsMap.values());

    // Priority 1: Find iteration with state 'started' that contains current date
    const startedIterations = iterations.filter(iter => iter.state === 'started');
    for (const iter of startedIterations) {
      if (iter.start_date && iter.due_date) {
        const start = new Date(iter.start_date);
        const end = new Date(iter.due_date);
        if (now >= start && now <= end) {
          return iter.title;
        }
      }
    }

    // Priority 2: If no active iteration found, take the most recent 'started' iteration
    if (startedIterations.length > 0) {
      // Sort by start date descending (most recent first)
      const mostRecentStarted = startedIterations
        .filter(iter => iter.start_date)
        .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())[0];
      
      if (mostRecentStarted) {
        return mostRecentStarted.title;
      }
    }

    // Priority 3: Find iteration that contains current date (regardless of state)
    for (const iter of iterations) {
      if (iter.start_date && iter.due_date) {
        const start = new Date(iter.start_date);
        const end = new Date(iter.due_date);
        if (now >= start && now <= end) {
          return iter.title;
        }
      }
    }

    // Priority 4: Take the iteration with most issues
    const mostPopular = iterations.sort((a, b) => b.issueCount - a.issueCount)[0];
    return mostPopular.title;
  }, [issues]);

  // Get milestone data for the current iteration
  const currentMilestone = useMemo(() => {
    if (!currentIteration) return undefined;
    
    // Find milestone that matches current iteration
    const milestone = issues.find(issue => 
      issue.milestone?.title === currentIteration
    )?.milestone;
    
    return milestone;
  }, [issues, currentIteration]);

  // Get iteration data for more accurate time calculations
  const currentIterationData = useMemo(() => {
    if (!currentIteration) return undefined;
    
    // Find iteration data from issues
    const iterationData = issues.find(issue => 
      issue.iteration?.title === currentIteration
    )?.iteration;
    
    return iterationData;
  }, [issues, currentIteration]);

  // Filter and group issues by status
  const statusColumns = useMemo(() => {
    // Only proceed if we have a current iteration
    if (!currentIteration) {
      return [];
    }

    // Filter issues for current iteration ONLY - exclude all other iterations
    const allIterationIssues = issues.filter(issue => {
      // Must have iteration data
      if (!issue.iteration?.title) {
        return false;
      }
      
      // Must be EXACTLY in current iteration (strict match)
      return issue.iteration.title === currentIteration;
    });

    // Group by resolved status or state
    const groupedByStatus: { [key: string]: GitLabIssue[] } = {};
    
    allIterationIssues.forEach(issue => {
      // Determine status for grouping
      let statusKey = '';
      
      if (issue.state === 'closed') {
        statusKey = 'Closed';
      } else if (issue.resolved_status) {
        statusKey = issue.resolved_status.name;
      } else {
        // Don't show opened state cards with no status (as per requirements)
        return;
      }
      
      if (!groupedByStatus[statusKey]) {
        groupedByStatus[statusKey] = [];
      }
      groupedByStatus[statusKey].push(issue);
    });

    // Define status order and get colors from resolved_status or fallback
    const statusOrder = [
      'To Do', 'Doing', 'Review', 'Testing', 'Done', 'Closed'
    ];
    


    // Create columns in order
    const columns: StatusColumn[] = [];
    
    // Add ordered status columns (excluding Closed for now)
    statusOrder.slice(0, -1).forEach(status => {
      if (groupedByStatus[status]) {
        columns.push({
          name: status,
          displayName: status,
          issues: groupedByStatus[status]
        });
      }
    });
    
    // Add any other statuses not in the predefined order (excluding Closed)
    Object.keys(groupedByStatus).forEach(status => {
      if (!statusOrder.includes(status) && status !== 'Closed') {
        columns.push({
          name: status,
          displayName: status,
          issues: groupedByStatus[status]
        });
      }
    });

    // Add closed issues at the end (as per requirements)
    if (groupedByStatus['Closed']) {
      columns.push({
        name: 'Closed',
        displayName: 'Closed',
        issues: groupedByStatus['Closed']
      });
    }

    return columns;
  }, [issues, currentIteration]);

  const totalIssues = statusColumns.reduce((sum, col) => sum + col.issues.length, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Sprint Analytics - Above Kanban Board */}
      <SprintAnalytics 
        issues={issues}
        users={users}
        currentIteration={currentIteration}
        milestone={currentMilestone}
        className="bg-muted/30 rounded-lg"
      />

      <div className="p-6 space-y-6">
      {/* Kanban Board */}
      <div className="flex gap-4 min-h-[500px] w-full">
        {statusColumns.map((column) => (
          <Card key={column.name} className="flex flex-col flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{column.displayName}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {column.issues.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <div className="space-y-3">
                {column.issues.map((issue) => (
                  <KanbanCard
                    key={issue.id}
                    issue={issue}
                    onClick={onIssueClick}
                  />
                ))}
                {column.issues.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No issues
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {!currentIteration && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No active iteration found
          </h3>
          <p className="text-sm text-muted-foreground">
            Please ensure issues have iterations assigned to see the Kanban board.
          </p>
        </div>
      )}
      
      {currentIteration && statusColumns.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No issues found for current iteration
          </h3>
          <p className="text-sm text-muted-foreground">
            Issues will appear here when they have proper status labels.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}