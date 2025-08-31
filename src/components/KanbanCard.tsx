import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User, Tag } from 'lucide-react';
import { GitLabIssue } from '@/types/gitlab';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  issue: GitLabIssue;
  onClick?: (issue: GitLabIssue) => void;
  className?: string;
  borderColor?: string;
}

const formatEstimatedTime = (timeEstimate: number): string => {
  if (timeEstimate === 0) return 'No estimate';
  
  const hours = Math.floor(timeEstimate / 3600);
  const minutes = Math.floor((timeEstimate % 3600) / 60);
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

export function KanbanCard({ issue, onClick, className, borderColor }: KanbanCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(issue);
    }
  };

  const estimatedTime = issue.time_stats?.time_estimate || 0;
  const primaryAssignee = issue.assignees?.[0];
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4",
        className
      )}
      onClick={handleClick}
      style={borderColor ? { borderLeftColor: borderColor } : undefined}
    >
      <CardContent className="p-3 space-y-2">
        {/* First line - Issue iid */}
        <div className="text-xs text-muted-foreground">
          #{issue.iid}
        </div>
        
        {/* Second line - Issue title (big font) */}
        <div className="font-semibold text-sm leading-tight">
          {issue.title}
        </div>
        
        {/* Third line - Assignee with icon */}
        <div className="flex items-center gap-2">
          {primaryAssignee ? (
            <>
              <Avatar className="w-5 h-5">
                <AvatarImage src={primaryAssignee.avatar_url} alt={primaryAssignee.name} />
                <AvatarFallback className="text-xs">
                  {primaryAssignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {primaryAssignee.name}
              </span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Unassigned
              </span>
            </>
          )}
        </div>
        
        {/* Fourth line - All labels with bullet points */}
        {issue.labels.length > 0 && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <div className="flex flex-col space-y-0.5">
              {issue.labels.map((label, index) => (
                <div key={index} className="flex items-start gap-1">
                  <span className="text-muted-foreground/70 mt-0.5">•</span>
                  <span className="line-clamp-1">{label.replace('Status::', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Fifth line - Estimated time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span>{formatEstimatedTime(estimatedTime)}</span>
        </div>
      </CardContent>
    </Card>
  );
}