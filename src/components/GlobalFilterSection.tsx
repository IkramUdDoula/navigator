import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchableMultiSelect } from '@/components/SearchableMultiSelect';
import { Search, Circle, User, Tag, Folder, Calendar, X } from 'lucide-react';
import { GitLabIssue, GitLabUser } from '@/types/gitlab';
import { useDebounce } from '@/components/PerformanceOptimizations';

interface GlobalFilterSectionProps {
  issues: GitLabIssue[];
  users: GitLabUser[];
  onFilteredDataChange: (filteredIssues: GitLabIssue[], hasActiveFilters: boolean, selectedFilters?: { assignees?: string[], iterations?: string[] }) => void;
}

export function GlobalFilterSection({ issues, users, onFilteredDataChange }: GlobalFilterSectionProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = React.useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = React.useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
  const [selectedIterations, setSelectedIterations] = React.useState<string[]>([]);

  // Debounce search term to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Extract unique labels from issues
  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => labels.add(label));
    });
    return Array.from(labels).sort();
  }, [issues]);

  // Extract unique projects from issues
  const allProjects = useMemo(() => {
    const projects = new Set<string>();
    issues.forEach(issue => {
      if (issue.web_url) {
        try {
          const projectName = new URL(issue.web_url).pathname.split('/')[2];
          if (projectName) {
            projects.add(projectName);
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }
    });
    return Array.from(projects).sort();
  }, [issues]);

  // Extract unique iterations from issues with date information
  const allIterationsWithDates = useMemo(() => {
    const iterations = new Map<string, { title: string; start_date?: string; due_date?: string }>();
    issues.forEach(issue => {
      if (issue.iteration?.title) {
        // Store the iteration with its date information
        iterations.set(issue.iteration.title, {
          title: issue.iteration.title,
          start_date: issue.iteration.start_date,
          due_date: issue.iteration.due_date
        });
      }
    });
    return Array.from(iterations.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [issues]);

  // Extract just the iteration titles for backward compatibility
  const allIterations = useMemo(() => {
    return allIterationsWithDates.map(iteration => iteration.title);
  }, [allIterationsWithDates]);

  // Create iteration options including the "Backlog" option
  const iterationOptions = useMemo(() => {
    // Add "Backlog" as a special option for issues with no iteration
    const options = allIterations.map(iteration => ({
      value: iteration,
      label: iteration
    }));
    
    // Add Backlog option at the beginning
    options.unshift({ value: 'Backlog', label: 'Backlog' });
    
    return options;
  }, [allIterations]);

  // Determine the current iteration based on date ranges
  const currentIteration = useMemo(() => {
    const now = new Date();
    for (const iteration of allIterationsWithDates) {
      if (iteration.start_date && iteration.due_date) {
        const startDate = new Date(iteration.start_date);
        const dueDate = new Date(iteration.due_date);
        if (startDate <= now && dueDate >= now) {
          return iteration.title;
        }
      }
    }
    return null;
  }, [allIterationsWithDates]);

  // Set current iteration as default when component mounts and no iterations are selected
  React.useEffect(() => {
    if (currentIteration && selectedIterations.length === 0) {
      setSelectedIterations([currentIteration]);
    }
  }, [currentIteration, selectedIterations.length]);

  // Create options for filters
  const statusOptions = [
    { value: 'opened', label: 'Open' },
    { value: 'closed', label: 'Closed' }
  ];

  const assigneeOptions = useMemo(() => {
    return users.map(user => ({
      value: user.id.toString(),
      label: user.name
    }));
  }, [users]);

  const labelOptions = useMemo(() => {
    return allLabels.map(label => ({
      value: label,
      label: label
    }));
  }, [allLabels]);

  const projectOptions = useMemo(() => {
    return allProjects.map(project => ({
      value: project,
      label: project
    }));
  }, [allProjects]);

  // Apply filters
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search filter
      if (debouncedSearchTerm && 
          !issue.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) && 
          !`#${issue.iid}`.includes(debouncedSearchTerm)) {
        return false;
      }
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(issue.state)) {
        return false;
      }
      
      // Assignee filter
      if (selectedAssignees.length > 0) {
        const issueAssigneeIds = issue.assignees.map(a => a.id.toString());
        if (!selectedAssignees.some(id => issueAssigneeIds.includes(id))) {
          return false;
        }
      }
      
      // Label filter
      if (selectedLabels.length > 0) {
        if (!selectedLabels.some(label => issue.labels.includes(label))) {
          return false;
        }
      }
      
      // Project filter
      if (selectedProjects.length > 0) {
        if (issue.web_url) {
          try {
            const projectName = new URL(issue.web_url).pathname.split('/')[2];
            if (!selectedProjects.includes(projectName)) {
              return false;
            }
          } catch (e) {
            // If we can't parse the URL, exclude the issue if any project filter is active
            return false;
          }
        } else {
          // If no web_url, exclude the issue if any project filter is active
          return false;
        }
      }
      
      // Iteration filter
      if (selectedIterations.length > 0) {
        // Handle special "Backlog" case - issues with no iteration assigned that are open
        if (selectedIterations.includes('Backlog')) {
          // If "Backlog" is selected, include issues that either:
          // 1. Have no iteration and are open (backlog items), OR
          // 2. Match any of the other selected iterations
          const isBacklogItem = !issue.iteration?.title && issue.state === 'opened';
          const matchesOtherIterations = issue.iteration?.title && selectedIterations.includes(issue.iteration.title);
          
          if (!isBacklogItem && !matchesOtherIterations) {
            return false;
          }
        } else {
          // Normal iteration filtering - only include issues that match selected iterations
          if (!issue.iteration?.title || !selectedIterations.includes(issue.iteration.title)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [issues, debouncedSearchTerm, selectedStatuses, selectedAssignees, selectedLabels, selectedProjects, selectedIterations]);

  // Notify parent of filtered data changes
  React.useEffect(() => {
    const hasActiveFilters = !!searchTerm || selectedStatuses.length > 0 || 
                            selectedAssignees.length > 0 || selectedLabels.length > 0 || 
                            selectedProjects.length > 0 || selectedIterations.length > 0;
    onFilteredDataChange(filteredIssues, hasActiveFilters, { 
      assignees: selectedAssignees,
      iterations: selectedIterations
    });
  }, [filteredIssues, onFilteredDataChange, searchTerm, selectedStatuses, selectedAssignees, selectedLabels, selectedProjects, selectedIterations]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setSelectedAssignees([]);
    setSelectedLabels([]);
    setSelectedProjects([]);
    setSelectedIterations([]);
  };

  const hasActiveFilters = searchTerm || selectedStatuses.length > 0 || 
                          selectedAssignees.length > 0 || selectedLabels.length > 0 || 
                          selectedProjects.length > 0 || selectedIterations.length > 0;

  // Check if we should show "No issues found" messages
  const showNoAssigneeIssues = selectedAssignees.length > 0 && 
    !issues.some(issue => {
      const issueAssigneeIds = issue.assignees.map(a => a.id.toString());
      return selectedAssignees.some(id => issueAssigneeIds.includes(id));
    });

  const showNoLabelIssues = selectedLabels.length > 0 && 
    !issues.some(issue => 
      selectedLabels.some(label => issue.labels.includes(label))
    );

  const showNoStatusIssues = selectedStatuses.length > 0 && 
    !issues.some(issue => selectedStatuses.includes(issue.state));

  const showNoProjectIssues = selectedProjects.length > 0 && 
    !issues.some(issue => {
      if (issue.web_url) {
        try {
          const projectName = new URL(issue.web_url).pathname.split('/')[2];
          return selectedProjects.includes(projectName);
        } catch (e) {
          return false;
        }
      }
      return false;
    });

  const showNoIterationIssues = selectedIterations.length > 0 && 
    !issues.some(issue => {
      if (selectedIterations.includes('Backlog')) {
        // For backlog, check if there are issues with no iteration that are open
        const isBacklogItem = !issue.iteration?.title && issue.state === 'opened';
        const matchesOtherIterations = issue.iteration?.title && selectedIterations.includes(issue.iteration.title);
        return isBacklogItem || matchesOtherIterations;
      }
      return selectedIterations.some(iteration => issue.iteration?.title === iteration);
    });

  const showNoSearchResults = debouncedSearchTerm && filteredIssues.length === 0;

  return (
    <div className="border-b bg-muted/30 p-4">
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by issue title or #IID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {hasActiveFilters && (
            <Button
              onClick={clearAllFilters}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
        
        {/* No results messages */}
        {showNoAssigneeIssues && (
          <div className="text-sm text-muted-foreground py-2">
            No issues found for the selected assignee(s)
          </div>
        )}
        
        {showNoLabelIssues && (
          <div className="text-sm text-muted-foreground py-2">
            No issues found with the selected label(s)
          </div>
        )}
        
        {showNoStatusIssues && (
          <div className="text-sm text-muted-foreground py-2">
            No issues found with the selected status(es)
          </div>
        )}
        
        {showNoProjectIssues && (
          <div className="text-sm text-muted-foreground py-2">
            No issues found for the selected project(s)
          </div>
        )}
        
        {showNoIterationIssues && (
          <div className="text-sm text-muted-foreground py-2">
            No issues found for the selected iteration(s)
          </div>
        )}
        
        {showNoSearchResults && (
          <div className="text-sm text-muted-foreground py-2">
            No issues found matching "{debouncedSearchTerm}"
          </div>
        )}
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[150px]">
            <SearchableMultiSelect
              options={statusOptions}
              selected={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="Status"
              icon={<Circle className="h-4 w-4" />}
            />
          </div>
          
          {/* Assignee Filter */}
          <div className="flex-1 min-w-[150px]">
            <SearchableMultiSelect
              options={assigneeOptions}
              selected={selectedAssignees}
              onChange={setSelectedAssignees}
              placeholder="Assignee"
              icon={<User className="h-4 w-4" />}
            />
          </div>
          
          {/* Label Filter */}
          <div className="flex-1 min-w-[150px]">
            <SearchableMultiSelect
              options={labelOptions}
              selected={selectedLabels}
              onChange={setSelectedLabels}
              placeholder="Label"
              icon={<Tag className="h-4 w-4" />}
            />
          </div>
          
          {/* Project Filter */}
          <div className="flex-1 min-w-[150px]">
            <SearchableMultiSelect
              options={projectOptions}
              selected={selectedProjects}
              onChange={setSelectedProjects}
              placeholder="Project"
              icon={<Folder className="h-4 w-4" />}
            />
          </div>
          
          {/* Iteration Filter */}
          <div className="flex-1 min-w-[150px]">
            <SearchableMultiSelect
              options={iterationOptions}
              selected={selectedIterations}
              onChange={setSelectedIterations}
              placeholder="Iteration"
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}