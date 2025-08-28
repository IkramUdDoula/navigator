import React, { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink } from 'lucide-react';
import { GitLabIssue } from '@/types/gitlab';

interface VirtualizedIssueListProps {
  issues: GitLabIssue[];
  height: number;
  itemHeight?: number;
}

// Memoized Issue Row Component
const IssueRow = memo(({ index, style, data }: any) => {
  const issue = data[index];
  
  return (
    <div style={style} className="px-2">
      <Card className="bg-muted/30 mb-2">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium line-clamp-2 flex-1">
                #{issue.iid} {issue.title}
              </h4>
              <a 
                href={issue.web_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {issue.labels.slice(0, 2).map((label: string) => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {issue.labels.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{issue.labels.length - 2}
                  </Badge>
                )}
              </div>
              
              <div className="flex -space-x-2">
                {issue.assignees.slice(0, 2).map((assignee: any) => (
                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={assignee.avatar_url} alt={assignee.name} />
                    <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {issue.assignees.length > 2 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs">+{issue.assignees.length - 2}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

IssueRow.displayName = 'IssueRow';

// Virtualized Issue List for Performance
export const VirtualizedIssueList = memo(({ 
  issues, 
  height, 
  itemHeight = 120 
}: VirtualizedIssueListProps) => {
  const memoizedIssues = useMemo(() => issues, [issues]);
  
  const itemCount = memoizedIssues.length;
  
  if (itemCount === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No issues found
      </div>
    );
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={itemCount}
      itemSize={itemHeight}
      itemData={memoizedIssues}
      className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
    >
      {IssueRow}
    </List>
  );
});

VirtualizedIssueList.displayName = 'VirtualizedIssueList';

// Performance hooks
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useMemoizedFilter = <T,>(
  items: T[],
  filterFn: (item: T) => boolean,
  dependencies: React.DependencyList
) => {
  return useMemo(() => {
    return items.filter(filterFn);
  }, [items, ...dependencies]);
};

// Optimized search hook
export const useOptimizedSearch = <T,>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceMs: number = 300
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  
  return useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return items.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchLower);
        }
        return false;
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);
};

// Memoized component wrapper
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, areEqual);
};

// Optimized event handlers
export const useOptimizedEventHandlers = () => {
  const handleClick = useCallback((callback: () => void) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      callback();
    };
  }, []);

  const handleKeyPress = useCallback((callback: () => void) => {
    return (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
      }
    };
  }, []);

  return { handleClick, handleKeyPress };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = React.useRef<number>();
  
  React.useEffect(() => {
    renderStartTime.current = performance.now();
  });
  
  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    }
  });
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, options]);
};