import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitLabUser, UserMetrics } from '@/types/gitlab';

interface MemberOverviewProps {
  users: GitLabUser[];
  userMetrics: UserMetrics[];
}

export function MemberOverview({ users, userMetrics }: MemberOverviewProps) {
  // Create a map for quick lookup of user metrics
  const userMetricsMap = new Map(userMetrics.map(metrics => [metrics.id, metrics]));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => {
            const metrics = userMetricsMap.get(user.id);
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      {metrics && (
                        <div className="mt-2">
                          <Badge variant="secondary">{metrics.role}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {metrics && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Issues</p>
                        <p className="font-semibold">{metrics.totalIssues}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completion Rate</p>
                        <p className="font-semibold">{metrics.completionRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-semibold">{metrics.pendingIssues}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Overdue</p>
                        <p className="font-semibold">{metrics.overdueIssues}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}