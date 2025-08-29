import { useState } from 'react';
import { GitLabIssue, GitLabUser } from '@/types/gitlab';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Flag,
  User,
  Play
} from 'lucide-react';
import { KanbanBoard, countKanbanIssues } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';

interface SprintPlanningTabProps {
  issues: GitLabIssue[];
  users: GitLabUser[];
  isLoading: boolean;
}

export function SprintPlanningTab({ issues, users, isLoading }: SprintPlanningTabProps) {
  const [activeView, setActiveView] = useState<'sprint' | 'backlog'>('sprint');

  // Helper function to get current iteration title
  const getCurrentIteration = () => {
    // Find all iterations
    const iterations = issues
      .filter(issue => issue.iteration)
      .map(issue => issue.iteration!.title);
      
    // Get unique iteration titles
    const uniqueIterations = [...new Set(iterations)];
    
    // Return the first iteration if available (assuming it's the current one)
    // In a real application, we might need more logic to determine the "current" iteration
    return uniqueIterations.length > 0 ? uniqueIterations[0] : null;
  };
  
  // Helper function to extract sprint number from iteration title
  const getSprintNumber = (iterationTitle: string | null) => {
    if (!iterationTitle) return '9'; // Default sprint number
    
    // Try to extract sprint number from title
    // This regex looks for "Sprint" followed by a number
    const match = iterationTitle.match(/Sprint\s*(\d+)/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // If no sprint number found, return default
    return '9';
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
  
  const currentIteration = getCurrentIteration();
  const sprintNumber = getSprintNumber(currentIteration);

  // Filter issues for backlog (issues without iteration and open)
  const backlogIssues = issues.filter(issue => 
    !issue.iteration && // No iteration assigned
    issue.state !== 'closed' // Open issues only
  );

  // Categorize backlog issues by priority
  const categorizeByPriority = (issues: GitLabIssue[]) => {
    const priorityGroups: Record<string, GitLabIssue[]> = {
      'High Priority': [],
      'Medium Priority': [],
      'Low Priority': [],
      'No Priority': []
    };

    issues.forEach(issue => {
      const priorityLabels = issue.labels.filter(label => 
        label.toLowerCase().includes('priority') || 
        label.toLowerCase().includes('p0') ||
        label.toLowerCase().includes('p1') ||
        label.toLowerCase().includes('p2') ||
        label.toLowerCase().includes('p3') ||
        label.toLowerCase().includes('high') ||
        label.toLowerCase().includes('medium') ||
        label.toLowerCase().includes('low')
      );

      if (priorityLabels.length > 0) {
        const priorityLabel = priorityLabels[0].toLowerCase();
        if (priorityLabel.includes('high') || priorityLabel.includes('p0') || priorityLabel.includes('p1')) {
          priorityGroups['High Priority'].push(issue);
        } else if (priorityLabel.includes('medium') || priorityLabel.includes('p2')) {
          priorityGroups['Medium Priority'].push(issue);
        } else if (priorityLabel.includes('low') || priorityLabel.includes('p3')) {
          priorityGroups['Low Priority'].push(issue);
        } else {
          priorityGroups['No Priority'].push(issue);
        }
      } else {
        priorityGroups['No Priority'].push(issue);
      }
    });

    return priorityGroups;
  };

  // Get unique assignees for an issue
  const getAssignees = (issue: GitLabIssue) => {
    return issue.assignees || [];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate days ago for display
  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const differenceMs = today.getTime() - date.getTime();
    const daysDifference = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
    return daysDifference === 0 ? 'Today' : `${daysDifference}d`;
  };

  // Render issue card for backlog view
  const renderBacklogIssueCard = (issue: GitLabIssue) => {
    const assignees = getAssignees(issue);
    
    // Filter labels to display - show all labels in backlog view
    const displayLabels = issue.labels;
    
    // Get formatted time estimate
    const timeEstimate = issue.time_stats?.time_estimate ? formatTimeEstimate(issue.time_stats.time_estimate) : '';
    
    return (
      <Card key={issue.id} className="mb-2 hover:shadow-sm transition-shadow bg-card">
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

  // Render backlog list with grid layout sectioned by priority
  const renderBacklogGrid = () => {
    const priorityGroups = categorizeByPriority(backlogIssues);
    
    return (
      <div className="p-4">
        {Object.entries(priorityGroups).map(([priority, issues]) => {
          // Only show priority sections that have issues
          if (issues.length === 0) return null;
          
          return (
            <div key={priority} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                {priority === 'High Priority' && <Flag className="h-4 w-4 mr-2 text-red-500" />}
                {priority === 'Medium Priority' && <Flag className="h-4 w-4 mr-2 text-amber-500" />}
                {priority === 'Low Priority' && <Flag className="h-4 w-4 mr-2 text-blue-500" />}
                {priority === 'No Priority' && <Flag className="h-4 w-4 mr-2 text-gray-500" />}
                {priority} ({issues.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {issues.map(issue => renderBacklogIssueCard(issue))}
              </div>
            </div>
          );
        })}
        
        {backlogIssues.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            No backlog items found
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* View Toggle */}
      <div className="border-b bg-background">
        <div className="flex px-6">
          <Button
            variant="ghost"
            className={`px-4 py-3 rounded-none border-b-2 ${
              activeView === 'sprint' 
                ? 'border-primary text-primary bg-muted/30' 
                : 'border-transparent hover:bg-muted/50'
            }`}
            onClick={() => setActiveView('sprint')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Sprint {sprintNumber}
            <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {countKanbanIssues(issues, currentIteration)}
            </span>
          </Button>
          <Button
            variant="ghost"
            className={`px-4 py-3 rounded-none border-b-2 ${
              activeView === 'backlog' 
                ? 'border-primary text-primary bg-muted/30' 
                : 'border-transparent hover:bg-muted/50'
            }`}
            onClick={() => setActiveView('backlog')}
          >
            <Flag className="h-4 w-4 mr-2" />
            Backlog
            <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
              {backlogIssues.length}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'sprint' ? 
          <KanbanBoard issues={issues} currentIteration={currentIteration} /> : 
          renderBacklogGrid()}
      </div>
    </div>
  );
}