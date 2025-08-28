import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitLabIssue, GitLabUser } from '@/types/gitlab';
import { MemberOverview } from '@/components/MemberOverview';
import { ProjectIssueProgress } from '@/components/ProjectIssueProgress';
import { calculateUserMetrics, calculateProjectMetrics } from '@/lib/teamMetricsUtils';

interface TeamTabProps {
  issues: GitLabIssue[];
  users: GitLabUser[];
  isLoading: boolean;
  selectedAssignees?: string[]; // Add selected assignees prop
}

export function TeamTab({ issues, users, isLoading, selectedAssignees }: TeamTabProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Filter users and issues based on selected assignees
  const { filteredUsers, filteredIssues } = useMemo(() => {
    if (!selectedAssignees || selectedAssignees.length === 0) {
      // No filter applied, return all users and issues
      return { filteredUsers: users, filteredIssues: issues };
    }

    // Filter users based on selected assignees
    const filteredUsers = users.filter(user => 
      selectedAssignees.includes(user.id.toString())
    );

    // Filter issues based on selected assignees
    const filteredIssues = issues.filter(issue => 
      issue.assignees.some(assignee => 
        selectedAssignees.includes(assignee.id.toString())
      )
    );

    return { filteredUsers, filteredIssues };
  }, [issues, users, selectedAssignees]);

  // Calculate all metrics using useMemo for performance
  const userMetrics = useMemo(() => calculateUserMetrics(filteredIssues, filteredUsers), [filteredIssues, filteredUsers]);
  const projectMetrics = useMemo(() => calculateProjectMetrics(filteredIssues), [filteredIssues]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-10 bg-muted rounded w-1/4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-16 bg-muted rounded w-full mb-3"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show message when no issues found
  if (filteredIssues.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground py-8">
          No issues found matching your filters
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
      </div>
      
      {/* Team Members Section */}
      <MemberOverview 
        users={filteredUsers} 
        userMetrics={userMetrics} 
      />
      
      {/* Project & Issue Progress Section */}
      <ProjectIssueProgress 
        issues={filteredIssues} 
        users={filteredUsers} 
        selectedProject={selectedProject} 
      />
    </div>
  );
}