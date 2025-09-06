import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitLabIssue, GitLabUser, ProjectMetrics } from '@/types/gitlab';
import { Progress } from '@/components/ui/progress';
import { calculateProjectMetrics } from '@/lib/teamMetricsUtils';

interface ProjectIssueProgressProps {
  issues: GitLabIssue[];
  users: GitLabUser[];
  selectedProject: string | null;
}

export function ProjectIssueProgress({ issues, users, selectedProject }: ProjectIssueProgressProps) {
  const projectMetrics = calculateProjectMetrics(issues);
  
  // Filter projects if a specific project is selected
  const filteredProjects = selectedProject && selectedProject !== 'all' 
    ? projectMetrics.filter(project => project.id === selectedProject)
    : projectMetrics;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project & Issue Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{project.name}</h3>
                <span className="text-sm text-muted-foreground">
                  {project.completedIssues} / {project.totalIssues} completed
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{project.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={project.completionRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{project.totalIssues}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">In Progress</p>
                  <p className="font-semibold">{project.inProgressIssues}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-semibold">{project.completedIssues}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-semibold">{project.pendingIssues}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Overdue</p>
                  <p className="font-semibold">{project.overdueIssues}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}