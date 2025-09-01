import { useState, useEffect, useMemo } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';
import { TabNavigation, TabType } from '@/components/TabNavigation';
import { NewEnhancedIssuesList } from '@/components/NewEnhancedIssuesList';
import { TeamTab } from '@/components/TeamTab';
import { IterationKanbanBoard } from '@/components/IterationKanbanBoard';

import { GlobalFilterSection } from '@/components/GlobalFilterSection';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGitLabIssuesWithEnhancedStatus, useGitLabUsers } from '@/hooks/useGitLabAPI';
import { GitLabCredentials, GitLabIssue } from '@/types/gitlab';

const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

const Index = () => {
  const [credentials, setCredentials] = useLocalStorage<GitLabCredentials | null>('gitlab-credentials', null);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [activeTab, setActiveTab] = useState<TabType>('issues');
  const [groupPath, setGroupPath] = useState(credentials?.groupId || 'devsel');
  const [filteredIssues, setFilteredIssues] = useState<GitLabIssue[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]); // Track selected assignees
  const [selectedIterations, setSelectedIterations] = useState<string[]>([]); // Track selected iterations
  const [lastActiveTime, setLastActiveTime] = useLocalStorage<number>('last-active-time', Date.now());

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Check for inactivity and refresh if needed
  useEffect(() => {
    const now = Date.now();
    const inactiveDuration = now - lastActiveTime;
    
    // If inactive for more than threshold, refresh data
    if (inactiveDuration > INACTIVITY_THRESHOLD && credentials) {
      // Force refresh of data
      window.location.reload();
    }
    
    // Update last active time
    setLastActiveTime(now);
    
    // Set up interval to update last active time
    const interval = setInterval(() => {
      setLastActiveTime(Date.now());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [lastActiveTime, credentials, setLastActiveTime]);

  const currentCredentials = credentials ? { ...credentials, groupId: groupPath } : null;

  // Fetch issues with enhanced status resolution
  const { data: issues = [], isLoading: issuesLoading, refetch: refetchIssues } = useGitLabIssuesWithEnhancedStatus(currentCredentials);
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useGitLabUsers(currentCredentials);

  // Extract unique labels from issues
  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => labels.add(label));
    });
    return Array.from(labels).sort();
  }, [issues]);

  // Determine the current iteration based on the logic from IterationKanbanBoard
  const defaultIteration = useMemo(() => {
    // Get all unique iterations from issues with their metadata
    const iterationsMap = new Map<string, {
      title: string;
      start_date?: string;
      due_date?: string;
      state: string;
      issueCount: number;
    }>();

    issues.forEach(issue => {
      if (issue.iteration?.title) {
        const existing = iterationsMap.get(issue.iteration.title);
        iterationsMap.set(issue.iteration.title, {
          title: issue.iteration.title,
          start_date: issue.iteration.start_date,
          due_date: issue.iteration.due_date,
          state: issue.iteration.state,
          issueCount: (existing?.issueCount || 0) + 1
        });
      }
    });

    if (iterationsMap.size === 0) {
      return null;
    }

    const now = new Date();
    const iterations = Array.from(iterationsMap.values());

    // Priority 1: Find iteration with state 'started' that contains current date
    const startedIterations = iterations.filter(iter => iter.state === 'started');
    for (const iter of startedIterations) {
      if (iter.start_date && iter.due_date) {
        const start = new Date(iter.start_date);
        const end = new Date(iter.due_date);
        if (now >= start && now <= end) {
          return iter.title;
        }
      }
    }

    // Priority 2: If no active iteration found, take the most recent 'started' iteration
    if (startedIterations.length > 0) {
      // Sort by start date descending (most recent first)
      const mostRecentStarted = startedIterations
        .filter(iter => iter.start_date)
        .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime())[0];
      
      if (mostRecentStarted) {
        return mostRecentStarted.title;
      }
    }

    // Priority 3: Find iteration that contains current date (regardless of state)
    for (const iter of iterations) {
      if (iter.start_date && iter.due_date) {
        const start = new Date(iter.start_date);
        const end = new Date(iter.due_date);
        if (now >= start && now <= end) {
          return iter.title;
        }
      }
    }

    // Priority 4: Take the iteration with most issues
    const mostPopular = iterations.sort((a, b) => b.issueCount - a.issueCount)[0];
    return mostPopular.title;
  }, [issues]);

  // Set the default iteration as the initial selected iteration
  useEffect(() => {
    if (defaultIteration && selectedIterations.length === 0) {
      setSelectedIterations([defaultIteration]);
    }
  }, [defaultIteration, selectedIterations.length]);

  const handleCredentialsSubmit = (newCredentials: GitLabCredentials) => {
    setCredentials(newCredentials);
    setGroupPath(newCredentials.groupId);
  };

  const handleLogout = () => {
    setCredentials(null);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleFilteredDataChange = (newFilteredIssues: GitLabIssue[], activeFilters: boolean, selectedFilters?: { assignees?: string[], iterations?: string[] }) => {
    setFilteredIssues(newFilteredIssues);
    setHasActiveFilters(activeFilters);
    if (selectedFilters?.assignees) {
      setSelectedAssignees(selectedFilters.assignees);
    }
    if (selectedFilters?.iterations) {
      setSelectedIterations(selectedFilters.iterations);
    }
  };

  if (!credentials) {
    return <AuthForm onCredentialsSubmit={handleCredentialsSubmit} />;
  }

  // Determine which issues to show based on filters
  const issuesToShow = hasActiveFilters ? filteredIssues : issues;
  const issueCount = issuesToShow.length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'issues':
        return <NewEnhancedIssuesList issues={issuesToShow} isLoading={issuesLoading} />;

      case 'team':
        return <TeamTab 
          issues={issuesToShow} 
          users={users} 
          isLoading={issuesLoading || usersLoading} 
          selectedAssignees={selectedAssignees} // Pass selected assignees
        />;
        
      case 'iteration':
        return <IterationKanbanBoard 
          issues={issuesToShow}
          onIssueClick={(issue) => {
            // Open issue URL in new tab
            window.open(issue.web_url, '_blank');
          }}
        />;
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        credentials={credentials}
        onLogout={handleLogout}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        groupPath={groupPath}
        allLabels={allLabels}
      />
      
      <GlobalFilterSection 
        issues={issues}
        users={users}
        onFilteredDataChange={handleFilteredDataChange}
      />
      
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        issueCount={issueCount}
      />
      
      {renderTabContent()}
    </div>
  );
};

export default Index;