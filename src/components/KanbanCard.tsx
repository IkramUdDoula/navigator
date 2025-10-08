import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User, Tag, Flag, Hash } from 'lucide-react';
import { GitLabIssue } from '@/types/gitlab';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface KanbanCardProps {
  issue: GitLabIssue;
  onClick?: (issue: GitLabIssue) => void;
  className?: string;
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

export function KanbanCard({ issue, onClick, className }: KanbanCardProps) {
  const [labelColors] = useLocalStorage<Record<string, string>>('label-colors', {});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const defaultColor = '#6c757d'; // Gray color as default

  // Listen for label color updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'label-colors-last-updated') {
        setLastUpdated(e.newValue);
      }
    };

    // Check for initial update timestamp
    const initialTimestamp = localStorage.getItem('label-colors-last-updated');
    if (initialTimestamp) {
      setLastUpdated(initialTimestamp);
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick(issue);
    }
  };

  const estimatedTime = issue.time_stats?.time_estimate || 0;
  const primaryAssignee = issue.assignees?.[0];
  
  // Get the first label's color for the border, or use default
  const borderColor = issue.labels.length > 0 ? 
    (labelColors[issue.labels[0]] || defaultColor) : 
    undefined;

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
        
        {/* Epic name - if exists */}
        {issue.epic?.title && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flag className="w-3 h-3 text-muted-foreground" />
            <span className="truncate">{issue.epic.title}</span>
          </div>
        )}
        
        {/* Fourth line - All labels with bullet points */}
        {issue.labels.length > 0 && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <div className="flex flex-col space-y-0.5">
              {issue.labels.map((label, index) => (
                <div key={index} className="flex items-start gap-1">
                  <Hash className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
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