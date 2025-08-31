import { useState, useMemo } from 'react';
import { GitLabIssue } from '@/types/gitlab';
import { groupIssues, GroupingCategory, GroupedIssues, getGroupMetadata } from '@/lib/newGroupingUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronRight, ChevronDown, Calendar, User, Tag, Link, Clock, MessageSquare, FileText, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from '@/components/StatusBadge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface NewEnhancedIssuesListProps {
  issues: GitLabIssue[];
  isLoading: boolean;
}

// Define the available grouping options with their labels
const GROUPING_OPTIONS: { id: GroupingCategory; label: string }[] = [
  { id: 'iteration', label: 'Iteration' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'status', label: 'Status' },
  { id: 'epic', label: 'Epic/Parent' },
];

// Component to display expanded issue details with professional vertical timeline UI
const IssueDetails = ({ issue }: { issue: GitLabIssue }) => {
  // Generate timeline events from issue data
  const timelineEvents = useMemo(() => {
    const events = [
      {
        id: 'created',
        icon: <PlusCircle className="h-4 w-4" />,
        title: 'Issue Created',
        description: `Created by ${issue.author?.name || issue.author?.username || 'Unknown'}`,
        date: issue.created_at,
        type: 'creation'
      },
      {
        id: 'updated',
        icon: <FileText className="h-4 w-4" />,
        title: 'Last Updated',
        description: 'Issue was last modified',
        date: issue.updated_at,
        type: 'update'
      }
    ];

    // Add label events if labels exist
    if (issue.labels && issue.labels.length > 0) {
      events.push({
        id: 'labels',
        icon: <Tag className="h-4 w-4" />,
        title: 'Labels Added',
        description: issue.labels.join(', '),
        date: issue.created_at,
        type: 'labels'
      });
    }

    // Add assignee events if assignees exist
    if (issue.assignees && issue.assignees.length > 0) {
      events.push({
        id: 'assignee',
        icon: <User className="h-4 w-4" />,
        title: 'Assignee',
        description: issue.assignees.map(a => a.name || a.username).join(', '),
        date: issue.created_at,
        type: 'assignee'
      });
    }

    // Sort events by date (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [issue]);

  return (
    <div className="mt-2 p-4 bg-muted/50 rounded-lg border border-muted">
      {/* Full issue title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{issue.title}</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Timeline */}
        <div className="lg:col-span-2">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* Timeline events */}
            <ul className="space-y-6">
              {timelineEvents.map((event, index) => (
                <li key={event.id} className="relative pl-12">
                  {/* Icon */}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border shadow-sm">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                      {event.icon}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{event.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Right column - Issue details */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">Created</span>
                <div className="font-medium text-sm">
                  {new Date(issue.created_at).toLocaleDateString()} at {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">Updated</span>
                <div className="font-medium text-sm">
                  {new Date(issue.updated_at).toLocaleDateString()} at {new Date(issue.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground">Author</span>
                <div className="font-medium text-sm">
                  {issue.author?.name || issue.author?.username || 'Unknown'}
                </div>
              </div>
            </div>
            
            {issue.assignees && issue.assignees.length > 0 && (
              <div className="flex items-start">
                <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">Assignee{issue.assignees.length > 1 ? 's' : ''}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {issue.assignees.map((assignee, index) => (
                      <div key={index} className="flex items-center bg-background rounded-full pl-1 pr-2 py-0.5 border">
                        <Avatar className="h-5 w-5 mr-1">
                          {assignee.avatar_url ? (
                            <AvatarImage src={assignee.avatar_url} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {assignee.name?.charAt(0) || assignee.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-xs">{assignee.name || assignee.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {issue.labels && issue.labels.length > 0 && (
              <div className="flex items-start">
                <Tag className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">Labels</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {issue.labels.map((label, index) => (
                      <div key={index} className="inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-xs font-medium">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {(issue.parent || issue.epic) && (
              <div className="flex items-start">
                <Link className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground">Linked Issues</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {issue.parent && (
                      <div className="inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-xs font-medium">
                        Parent: {issue.parent.title}
                      </div>
                    )}
                    {issue.epic && (
                      <div className="inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-xs font-medium">
                        Epic: {issue.epic.title}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {issue.description && (
            <div>
              <div className="flex items-center mb-2">
                <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="text-sm font-medium">Description</h4>
              </div>
              <div className="bg-background p-3 rounded-lg border text-sm prose prose-sm max-w-none">
                {issue.description.length > 300 ? `${issue.description.substring(0, 300)}...` : issue.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function NewEnhancedIssuesList({ issues, isLoading }: NewEnhancedIssuesListProps) {
  const [selectedGrouping, setSelectedGrouping] = useState<GroupingCategory[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [groupPagination, setGroupPagination] = useState<Record<string, number>>({});
  const issuesPerPage = 20;

  // Toggle a grouping option
  const toggleGroupingOption = (optionId: GroupingCategory) => {
    setSelectedGrouping(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  // Clear all grouping selections
  const clearGrouping = () => {
    setSelectedGrouping([]);
  };

  // Collapse all sections and expanded issue details
  const collapseAll = () => {
    setExpandedGroups(new Set());
    setExpandedIssues(new Set());
  };

  // Check if there are any expanded sections or issues
  const hasExpandedSections = expandedGroups.size > 0 || expandedIssues.size > 0;

  // Toggle issue expansion
  const toggleIssue = (issueId: number) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  // Group issues based on selected grouping options
  const groupedResult = useMemo(() => {
    return groupIssues(selectedGrouping, issues);
  }, [issues, selectedGrouping]);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Pagination logic for flat issue list
  const paginatedIssues = useMemo(() => {
    if (groupedResult.level === 0) {
      const startIndex = (currentPage - 1) * issuesPerPage;
      const endIndex = startIndex + issuesPerPage;
      return issues.slice(startIndex, endIndex);
    }
    return issues;
  }, [issues, currentPage, groupedResult.level]);

  // Total pages calculation
  const totalPages = useMemo(() => {
    if (groupedResult.level === 0) {
      return Math.ceil(issues.length / issuesPerPage);
    }
    return 1;
  }, [issues.length, groupedResult.level]);

  // Pagination component
  const renderPagination = () => {
    if (groupedResult.level > 0 || totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pages.map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Render a flat table of issues when no grouping is selected
  const renderFlatIssueList = () => {
    if (issues.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No issues found matching your filters
        </div>
      );
    }

    return (
      <div>
        <div className="rounded-md border m-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[100px]">Issue</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-right">Estimate (h)</TableHead>
                <TableHead className="text-right">Spent (h)</TableHead>
                <TableHead className="text-right">Remaining (h)</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedIssues.map((issue) => {
                const timeStats = issue.time_stats || { time_estimate: 0, total_time_spent: 0 };
                const estimate = (timeStats.time_estimate || 0) / 3600;
                const spent = (timeStats.total_time_spent || 0) / 3600;
                const remaining = Math.max(0, (timeStats.time_estimate || 0) - (timeStats.total_time_spent || 0)) / 3600;
                const assigneeName = issue.assignees && issue.assignees.length > 0 
                  ? issue.assignees[0].name 
                  : 'Unassigned';
                const isExpanded = expandedIssues.has(issue.id);
                
                return (
                  <>
                    <TableRow 
                      key={issue.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleIssue(issue.id)}
                    >
                      <TableCell>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium">#{issue.iid}</TableCell>
                      <TableCell className="max-w-xs truncate">{issue.title}</TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={issue.resolved_status?.name || issue.state}
                          variant={issue.resolved_status?.source === 'label' ? 'status' : 
                                   issue.state === 'closed' ? 'closed' : 'opened'}
                          color={issue.resolved_status?.color}
                        />
                      </TableCell>
                      <TableCell>
                        {issue.assignees && issue.assignees.length > 0 ? (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              {issue.assignees[0].avatar_url ? (
                                <AvatarImage src={issue.assignees[0].avatar_url} />
                              ) : (
                                <AvatarFallback>
                                  {issue.assignees[0].name.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">{issue.assignees[0].name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{estimate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{spent.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{remaining.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <a 
                          href={issue.web_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${issue.id}-details`}>
                        <TableCell colSpan={9} className="p-0">
                          <IssueDetails issue={issue} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              
              {/* Pagination Controls - Integrated into table */}
              <TableRow className="border-t">
                <TableCell colSpan={9} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * issuesPerPage + 1, issues.length)} to {Math.min(currentPage * issuesPerPage, issues.length)} of {issues.length} issues
                    </div>
                    {renderPagination()}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Render grouped issues recursively
  const renderGroupedIssues = (data: GroupedIssues, level: number, hierarchy: GroupingCategory[], parentId: string = '') => {
    // If we've reached the deepest level (issues)
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return (
          <div className="text-center text-muted-foreground py-4">
            No issues found matching your filters
          </div>
        );
      }
      
      // Get or set the current page for this group
      const groupPage = groupPagination[parentId] || 1;
      
      // Calculate paginated issues for this group
      const startIndex = (groupPage - 1) * issuesPerPage;
      const endIndex = startIndex + issuesPerPage;
      const paginatedGroupIssues = data.slice(startIndex, endIndex);
      
      // Calculate total pages for this group
      const groupTotalPages = Math.ceil(data.length / issuesPerPage);
      
      // Function to change page for this specific group
      const setGroupPage = (page: number) => {
        setGroupPagination(prev => ({
          ...prev,
          [parentId]: page
        }));
      };
      
      // Render pagination for this group
      const renderGroupPagination = () => {
        if (groupTotalPages <= 1) return null;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, groupPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(groupTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }

        return (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => groupPage > 1 && setGroupPage(groupPage - 1)}
                  className={groupPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {startPage > 1 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => setGroupPage(1)}>1</PaginationLink>
                  </PaginationItem>
                  {startPage > 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}
              
              {pages.map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setGroupPage(page)}
                    isActive={page === groupPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {endPage < groupTotalPages && (
                <>
                  {endPage < groupTotalPages - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink onClick={() => setGroupPage(groupTotalPages)}>{groupTotalPages}</PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => groupPage < groupTotalPages && setGroupPage(groupPage + 1)}
                  className={groupPage === groupTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        );
      };
      
      return (
        <div className="space-y-4">
          <div className="rounded-md border mt-2 m-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[100px]">Issue</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead className="text-right">Estimate (h)</TableHead>
                  <TableHead className="text-right">Spent (h)</TableHead>
                  <TableHead className="text-right">Remaining (h)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroupIssues.map((issue) => {
                  const timeStats = issue.time_stats || { time_estimate: 0, total_time_spent: 0 };
                  const estimate = (timeStats.time_estimate || 0) / 3600;
                  const spent = (timeStats.total_time_spent || 0) / 3600;
                  const remaining = Math.max(0, (timeStats.time_estimate || 0) - (timeStats.total_time_spent || 0)) / 3600;
                  const assigneeName = issue.assignees && issue.assignees.length > 0 
                    ? issue.assignees[0].name 
                    : 'Unassigned';
                  const isExpanded = expandedIssues.has(issue.id);
                  
                  return (
                    <>
                      <TableRow 
                        key={issue.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleIssue(issue.id)}
                      >
                        <TableCell>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="font-medium">#{issue.iid}</TableCell>
                        <TableCell className="max-w-xs truncate">{issue.title}</TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={issue.resolved_status?.name || issue.state}
                            variant={issue.resolved_status?.source === 'label' ? 'status' : 
                                     issue.state === 'closed' ? 'closed' : 'opened'}
                            color={issue.resolved_status?.color}
                          />
                        </TableCell>
                        <TableCell>
                          {issue.assignees && issue.assignees.length > 0 ? (
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                {issue.assignees[0].avatar_url ? (
                                  <AvatarImage src={issue.assignees[0].avatar_url} />
                                ) : (
                                  <AvatarFallback>
                                    {issue.assignees[0].name.charAt(0)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="text-sm truncate max-w-[120px]">{issue.assignees[0].name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{estimate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{spent.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{remaining.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <a 
                            href={issue.web_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${issue.id}-details`}>
                          <TableCell colSpan={9} className="p-0">
                            <IssueDetails issue={issue} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                
                {/* Group Pagination Controls - Integrated into table */}
                {data.length > issuesPerPage && (
                  <TableRow className="border-t">
                    <TableCell colSpan={9} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Showing {Math.min((groupPage - 1) * issuesPerPage + 1, data.length)} to {Math.min(groupPage * issuesPerPage, data.length)} of {data.length} issues
                        </div>
                        {renderGroupPagination()}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }
    
    // Otherwise, render groups
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([groupName, groupData]) => {
          const currentGroupId = parentId ? `${parentId}-${groupName}` : groupName;
          const isExpanded = expandedGroups.has(currentGroupId);
          const metadata = getGroupMetadata(groupData);
          
          return (
            <Card key={currentGroupId}>
              <CardHeader 
                className="cursor-pointer flex flex-row items-center justify-between"
                onClick={() => toggleGroup(currentGroupId)}
              >
                <CardTitle className="text-lg flex items-center">
                  {isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  <span>{groupName}</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {metadata.issueCount} issues
                  </Badge>
                  <Badge variant="outline">
                    {metadata.totalEstimate.toFixed(1)}h est
                  </Badge>
                  <Badge variant="outline">
                    {metadata.totalTimeSpent.toFixed(1)}h spent
                  </Badge>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent>
                  {renderGroupedIssues(groupData, level + 1, hierarchy, currentGroupId)}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grouping Controls */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-muted rounded-lg">
        <span className="text-sm font-medium mr-2">Group by:</span>
        {GROUPING_OPTIONS.map((option) => (
          <Button
            key={option.id}
            variant={selectedGrouping.includes(option.id) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleGroupingOption(option.id)}
            className={`text-xs ${selectedGrouping.includes(option.id) ? 'dark:bg-white dark:text-black' : ''}`}
          >
            {option.label}
          </Button>
        ))}
        
        {(selectedGrouping.length > 0) && (
          <>
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearGrouping}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              disabled={!hasExpandedSections}
              className="text-xs"
            >
              Collapse All
            </Button>
          </>
        )}
      </div>

      {/* Issues Display */}
      {groupedResult.level === 0 ? (
        renderFlatIssueList()
      ) : (
        renderGroupedIssues(groupedResult.data, 0, groupedResult.hierarchy)
      )}
    </div>
  );
}