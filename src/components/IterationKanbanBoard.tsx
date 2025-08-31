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
  
  // Filter and group issues by status
  const statusColumns = useMemo(() => {
    // Group by resolved status or state
    const groupedByStatus: { [key: string]: GitLabIssue[] } = {};
    
    issues.forEach(issue => {
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
  }, [issues]);

  const totalIssues = statusColumns.reduce((sum, col) => sum + col.issues.length, 0);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Sprint Analytics - Above Kanban Board */}
      <SprintAnalytics 
        issues={issues}
        users={users}
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
      {statusColumns.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No issues found
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