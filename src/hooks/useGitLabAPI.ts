import { useQuery } from '@tanstack/react-query';
import { GitLabCredentials, GitLabIssue, GitLabUser, GitLabLabel, StatusLabelData } from '@/types/gitlab';
import { StatusResolutionService } from '@/lib/statusResolutionService';
import { useMemo } from 'react';

const createGitLabClient = (credentials: GitLabCredentials) => {
  const baseURL = credentials.host.replace(/\/$/, '');
  
  const makeRequest = async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${baseURL}/api/v4${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitLab API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  };

  return { makeRequest };
};

// Updated version to fetch all issues with pagination
export const useGitLabIssues = (credentials: GitLabCredentials | null) => {
  return useQuery({
    queryKey: ['gitlab-issues', credentials?.groupId],
    queryFn: async (): Promise<GitLabIssue[]> => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      let allIssues: GitLabIssue[] = [];
      let page = 1;
      let hasMore = true;
      
      // Fetch all issues using pagination
      while (hasMore) {
        // Add time_stats parameter to fetch time tracking data
        const endpoint = `/groups/${credentials.groupId}/issues?per_page=100&page=${page}&with_time_stats=true`;
        const issues = await client.makeRequest<GitLabIssue[]>(endpoint);
        
        allIssues = [...allIssues, ...issues];
        
        // If we got less than 100 issues, we've reached the end
        if (issues.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      return allIssues;
    },
    enabled: !!credentials,
    refetchOnWindowFocus: false,
  });
};

export const useGitLabUsers = (credentials: GitLabCredentials | null) => {
  return useQuery({
    queryKey: ['gitlab-users', credentials?.groupId],
    queryFn: async (): Promise<GitLabUser[]> => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      return client.makeRequest<GitLabUser[]>(`/groups/${credentials.groupId}/members?per_page=100`);
    },
    enabled: !!credentials,
    refetchOnWindowFocus: false,
  });
};

export const useGitLabGroup = (credentials: GitLabCredentials | null) => {
  return useQuery({
    queryKey: ['gitlab-group', credentials?.groupId],
    queryFn: async () => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      return client.makeRequest(`/groups/${credentials.groupId}`);
    },
    enabled: !!credentials,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch GitLab project labels with fallback strategy
 * First tries to fetch from group level, then falls back to project labels
 */
export const useGitLabProjectLabels = (credentials: GitLabCredentials | null) => {
  return useQuery({
    queryKey: ['gitlab-project-labels', credentials?.groupId],
    queryFn: async (): Promise<GitLabLabel[]> => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      let allLabels: GitLabLabel[] = [];
      
      try {
        // First try to get labels from the group level
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          const endpoint = `/groups/${credentials.groupId}/labels?per_page=100&page=${page}`;
          const labels = await client.makeRequest<GitLabLabel[]>(endpoint);
          
          allLabels = [...allLabels, ...labels];
          
          if (labels.length < 100) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        // If no group labels found, try to get from projects within the group
        if (allLabels.length === 0) {
          const projects = await client.makeRequest<any[]>(`/groups/${credentials.groupId}/projects?per_page=100`);
          
          for (const project of projects) {
            try {
              let projectPage = 1;
              let projectHasMore = true;
              
              while (projectHasMore) {
                const projectLabels = await client.makeRequest<GitLabLabel[]>(
                  `/projects/${project.id}/labels?per_page=100&page=${projectPage}`
                );
                
                allLabels = [...allLabels, ...projectLabels];
                
                if (projectLabels.length < 100) {
                  projectHasMore = false;
                } else {
                  projectPage++;
                }
              }
            } catch (error) {
              // Continue with other projects if one fails
              console.warn(`Failed to fetch labels for project ${project.id}:`, error);
            }
          }
        }
        
        // Remove duplicates based on title
        const uniqueLabels = allLabels.filter((label, index, self) => 
          index === self.findIndex(l => l.title === label.title)
        );
        
        return uniqueLabels;
        
      } catch (error) {
        console.error('Failed to fetch GitLab labels:', error);
        return [];
      }
    },
    enabled: !!credentials,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to process GitLab labels and extract status information
 */
export const useGitLabLabelsWithStatus = (credentials: GitLabCredentials | null) => {
  const { data: labels } = useGitLabProjectLabels(credentials);
  
  const statusLabelData = useMemo((): StatusLabelData => {
    if (!labels) return { statusLabels: [], colorMapping: {} };
    
    return StatusResolutionService.processLabelData(labels);
  }, [labels]);
  
  return {
    labels,
    statusLabels: statusLabelData.statusLabels,
    colorMapping: statusLabelData.colorMapping
  };
};

/**
 * Hook to fetch GitLab issues with enhanced status resolution
 */
export const useGitLabIssuesWithEnhancedStatus = (credentials: GitLabCredentials | null) => {
  const { data: issues, isLoading, error, refetch } = useGitLabIssues(credentials);
  const { colorMapping } = useGitLabLabelsWithStatus(credentials);
  
  const issuesWithStatus = useMemo(() => {
    if (!issues) return [];
    
    return StatusResolutionService.resolveMultipleIssuesStatus(issues, colorMapping);
  }, [issues, colorMapping]);
  
  return {
    data: issuesWithStatus,
    isLoading,
    error,
    refetch
  };
};