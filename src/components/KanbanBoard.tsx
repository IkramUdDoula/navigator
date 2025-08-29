import { GitLabIssue } from '@/types/gitlab';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  CheckCircle2,
  Play,
  Eye,
  User
} from 'lucide-react';

interface KanbanBoardProps {
  issues: GitLabIssue[];
  currentIteration: string | null;
}

// Helper function to determine issue status from labels
const getIssueStatus = (issue: GitLabIssue): string | null => {
  // First, check for explicit Status: labels
  const statusLabels = issue.labels.filter(label => label.startsWith('Status:'));
  if (statusLabels.length > 0) {
    let status = statusLabels[0].replace('Status:', '').trim();
    // Normalize "To Do" variations
    if (status.toLowerCase() === 'to do' || status.toLowerCase() === 'todo') {
      return 'To Do';
    }
    return status;
  }
  
  // Check common status labels
  if (issue.labels.includes('Done')) {
    return 'Done';
  } else if (issue.labels.includes('Review') || issue.labels.includes('Code Review')) {
    return 'Review';
  } else if (issue.labels.includes('Doing') || issue.labels.includes('In Progress')) {
    return 'In Progress';
  } else if (issue.labels.includes('Blocked') || issue.labels.includes('On Hold')) {
    return 'Blocked';
  } else if (issue.labels.includes('To Do') || issue.labels.includes('Ready')) {
    return 'To Do';
  } else if (issue.labels.includes('Testing') || issue.labels.includes('QA')) {
    return 'Testing';
  }
  
  // Return null for issues without status (these will be excluded)
  return null;
};

// Helper function to format time estimate
const formatTimeEstimate = (seconds: number): string => {
  if (seconds <= 0) return '';
  
  // Convert seconds to hours
  const hours = seconds / 3600;
  
  // If less than 1 hour, show in minutes
  if (hours < 1) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  }
  
  // If less than 8 hours, show in hours
  if (hours < 8) {
    return `${Math.round(hours)}h`;
  }
  
  // Otherwise, show in days (assuming 8-hour workday)
  const days = hours / 8;
  return `${Math.round(days)}d`;
};

// Function to count issues that will be displayed in the Kanban board
export const countKanbanIssues = (issues: GitLabIssue[], currentIteration: string | null) => {
  // Filter issues for current sprint (issues with milestone OR in current iteration)
  // Only include open issues in the sprint view
  const currentSprintIssues = issues.filter(issue => 
    (issue.state !== 'closed') && // Only open issues
    (
      // Include issues with milestone
      (issue.milestone) ||
      // Include issues from current iteration
      (currentIteration && issue.iteration?.title === currentIteration)
    )
  );

  // Get closed issues in current sprint
  const closedSprintIssues = issues.filter(issue => 
    issue.state === 'closed' &&
    // Only include closed issues that are specifically in the current iteration
    (currentIteration && issue.iteration?.title === currentIteration)
  );

  // Count open issues with defined status
  const openIssuesWithStatus = currentSprintIssues.filter(issue => {
    const status = getIssueStatus(issue);
    return status !== null; // Only count issues with a defined status
  }).length;

  // Total count is open issues with status plus closed issues
  return openIssuesWithStatus + closedSprintIssues.length;
};

export function KanbanBoard({ issues, currentIteration }: KanbanBoardProps) {
  // Filter issues for current sprint (issues with milestone OR in current iteration)
  // Only include open issues in the sprint view
  const currentSprintIssues = issues.filter(issue => 
    (issue.state !== 'closed') && // Only open issues
    (
      // Include issues with milestone
      (issue.milestone) ||
      // Include issues from current iteration
      (currentIteration && issue.iteration?.title === currentIteration)
    )
  );

  // Get closed issues in current sprint
  const closedSprintIssues = issues.filter(issue => 
    issue.state === 'closed' &&
    // Only include closed issues that are specifically in the current iteration
    (currentIteration && issue.iteration?.title === currentIteration)
  );

  // Group sprint issues by status
  const groupedSprintIssues = currentSprintIssues.reduce((acc, issue) => {
    let status = getIssueStatus(issue);
    
    // Skip issues without status (explicitly filter them out)
    if (status === null) {
      return acc;
    }
    
    // Ensure all "To Do" variations are grouped under the same key
    if (status.toLowerCase() === 'to do' || status.toLowerCase() === 'todo' || status === 'Ready') {
      status = 'To Do';
    }
    
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(issue);
    return acc;
  }, {} as Record<string, GitLabIssue[]>);

  // Define board columns with their properties
  const boardColumns = [
    { id: 'To Do', icon: <AlertCircle className="h-4 w-4" />, color: 'text-gray-500' },
    { id: 'In Progress', icon: <Play className="h-4 w-4" />, color: 'text-blue-500' },
    { id: 'Review', icon: <Eye className="h-4 w-4" />, color: 'text-amber-500' },
    { id: 'Testing', icon: <AlertCircle className="h-4 w-4" />, color: 'text-purple-500' },
    { id: 'Blocked', icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-500' },
    { id: 'Done', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-500' },
  ];

  // Get all unique statuses from issues (excluding Closed since it's handled separately)
  const activeStatuses = Object.keys(groupedSprintIssues);
  
  // Create column definitions for all active statuses
  const statusColumnDefs = activeStatuses.map(status => {
    const predefinedColumn = boardColumns.find(col => col.id === status);
    return predefinedColumn || {
      id: status,
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-gray-500'
    };
  });
  
  // Always add Closed column at the end if there are closed issues
  const closedColumn = { 
    id: 'Closed', 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: 'text-green-500' 
  };
  
  // Combine all column definitions
  const allColumnDefs = [...statusColumnDefs];
  if (closedSprintIssues.length > 0) {
    allColumnDefs.push(closedColumn);
  }

  // Get unique assignees for an issue
  const getAssignees = (issue: GitLabIssue) => {
    return issue.assignees || [];
  };

  // Calculate days ago for display
  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const differenceMs = today.getTime() - date.getTime();
    const daysDifference = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
    return daysDifference === 0 ? 'Today' : `${daysDifference}d`;
  };

  // Render issue card with only the requested information
  const renderIssueCard = (issue: GitLabIssue) => {
    const assignees = getAssignees(issue);
    
    // Filter labels to display - exclude status labels in kanban view
    const displayLabels = issue.labels
      .filter(label => {
        // In kanban view, exclude status labels since we're already grouped by status
        return !label.startsWith('Status:') && 
               !['Doing', 'In Progress', 'Review', 'Code Review', 'Done', 'Testing', 'QA', 'Blocked', 'On Hold', 'To Do', 'Ready'].includes(label);
      });
    
    // Get status color for visual indicator
    const status = getIssueStatus(issue);
    const statusColumn = boardColumns.find(col => col.id === status);
    const statusColor = statusColumn?.color.replace('text-', 'border-') || 'border-gray-300';
    
    // Get formatted time estimate
    const timeEstimate = issue.time_stats?.time_estimate ? formatTimeEstimate(issue.time_stats.time_estimate) : '';
    
    return (
      <Card key={issue.id} 
        className={`mb-2 hover:shadow-sm transition-shadow border-l-4 ${statusColor} bg-card`}
      >
        <CardContent className="p-4">
          {/* Issue Number */}
          <div className="text-sm font-medium text-muted-foreground mb-1">#{issue.iid}</div>
          
          {/* Title */}
          <h3 className="text-sm font-medium mb-3">
            <a 
              href={issue.web_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline cursor-pointer"
            >
              {issue.title}
            </a>
          </h3>
          
          {/* Labels - with adjusted spacing for better wrapping with many labels */}
          <div className="flex flex-wrap gap-1 mb-3 max-h-[80px] overflow-y-auto">
            {displayLabels.map(label => {
              // Style based on label type
              const isPriorityLabel = label.startsWith('Priority:');
              const isBugLabel = label === 'Bug';
              const isWebLabel = label === 'Web';
              
              return (
                <Badge 
                  key={label} 
                  variant={isPriorityLabel ? "secondary" : "outline"}
                  className="text-xs px-1.5 py-0 rounded-full"
                >
                  {label}
                </Badge>
              );
            })}
          </div>
          
          {/* Assignee and estimation in bottom row */}
          <div className="flex items-center justify-between text-muted-foreground">
            {assignees.length > 0 && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span className="text-sm">{assignees[0].username || assignees[0].name}</span>
              </div>
            )}
            
            {timeEstimate && (
              <div className="flex items-center">
                <Play className="h-4 w-4 mr-1" />
                <span className="text-sm">{timeEstimate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex space-x-4 overflow-x-auto p-4">
      {allColumnDefs.map(column => {
        // Get issues for this column
        let issues = [];
        if (column.id === 'Closed') {
          issues = closedSprintIssues;
        } else {
          issues = groupedSprintIssues[column.id] || [];
        }
        
        return (
          <div key={column.id} className="flex-1 min-w-[250px]">
            <div className="bg-muted rounded-t-lg p-3 flex items-center">
              <h3 className="font-semibold flex items-center">
                <span className={`mr-2 ${column.color}`}>{column.icon}</span>
                {column.id}
                <span className="ml-2 bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                  {issues.length}
                </span>
              </h3>
            </div>
            <div className="border rounded-b-lg min-h-[200px] p-2 bg-background">
              {issues.length > 0 ? (
                issues.map(issue => renderIssueCard(issue))
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  No issues
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}