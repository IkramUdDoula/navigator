import { useState, useEffect } from 'react';
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

const Index = () => {
  const [credentials, setCredentials] = useLocalStorage<GitLabCredentials | null>('gitlab-credentials', null);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [activeTab, setActiveTab] = useState<TabType>('issues');
  const [groupPath, setGroupPath] = useState(credentials?.groupId || 'devsel');
  const [filteredIssues, setFilteredIssues] = useState<GitLabIssue[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]); // Track selected assignees

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Update credentials when group path changes
  useEffect(() => {
    if (credentials && groupPath !== credentials.groupId) {
      const updatedCredentials = { ...credentials, groupId: groupPath };
      setCredentials(updatedCredentials);
    }
  }, [groupPath, credentials, setCredentials]);

  const currentCredentials = credentials ? { ...credentials, groupId: groupPath } : null;

  // Fetch issues with enhanced status resolution
  const { data: issues = [], isLoading: issuesLoading } = useGitLabIssuesWithEnhancedStatus(currentCredentials);
  const { data: users = [], isLoading: usersLoading } = useGitLabUsers(currentCredentials);

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

  const handleFilteredDataChange = (newFilteredIssues: GitLabIssue[], activeFilters: boolean, selectedFilters?: { assignees?: string[] }) => {
    setFilteredIssues(newFilteredIssues);
    setHasActiveFilters(activeFilters);
    if (selectedFilters?.assignees) {
      setSelectedAssignees(selectedFilters.assignees);
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
        onGroupPathChange={setGroupPath}
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