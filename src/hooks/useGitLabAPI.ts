import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitLabCredentials, GitLabIssue, GitLabUser, GitLabLabel, StatusLabelData, GitLabProject, CreateIssueRequest, GitLabIteration } from '@/types/gitlab';
import { StatusResolutionService } from '@/lib/statusResolutionService';
import { useMemo } from 'react';

const createGitLabClient = (credentials: GitLabCredentials) => {
  const baseURL = credentials.host.replace(/\/$/, '');
  
  const makeRequest = async <T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: any): Promise<T> => {
    const response = await fetch(`${baseURL}/api/v4${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
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

/**
 * Hook to fetch GitLab projects within a group
 */
export const useGitLabGroupProjects = (credentials: GitLabCredentials | null) => {
  return useQuery({
    queryKey: ['gitlab-group-projects', credentials?.groupId],
    queryFn: async (): Promise<GitLabProject[]> => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      return client.makeRequest<GitLabProject[]>(
        `/groups/${credentials.groupId}/projects?per_page=100&simple=true&archived=false`
      );
    },
    enabled: !!credentials,
    refetchOnWindowFocus: false,
  });
};
  /**
   * Hook to create a new GitLab issue
   */
export const useCreateGitLabIssue = (credentials: GitLabCredentials | null) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (issueData: CreateIssueRequest) => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      // 1) Create the issue first
      // GitLab expects labels as a comma-separated string, not an array
      const createPayload: any = {
        ...issueData,
        ...(issueData.labels && issueData.labels.length
          ? { labels: issueData.labels.join(',') }
          : {}),
      };

      const created = await client.makeRequest<GitLabIssue>(
        `/projects/${issueData.projectId}/issues`,
        'POST',
        createPayload
      );

      // 2) Ensure description is set (some setups ignore description on create with JSON bodies)
      if (issueData.description && created?.iid && created.description !== issueData.description) {
        try {
          await client.makeRequest<GitLabIssue>(
            `/projects/${issueData.projectId}/issues/${created.iid}`,
            'PUT',
            { description: issueData.description }
          );
        } catch (e) {
          console.warn('Failed to set description via update API:', e);
        }
      }

      // 3) If provided, set time estimate via the dedicated endpoint
      // GitLab REST requires a duration string (e.g., 3h30m) on a separate endpoint
      if (issueData.time_estimate && created?.iid) {
        try {
          const seconds = issueData.time_estimate;
          const totalMinutes = Math.max(0, Math.floor(seconds / 60));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const duration = `${hours > 0 ? `${hours}h` : ''}${minutes > 0 ? `${minutes}m` : hours === 0 ? '0m' : ''}`;

          await client.makeRequest(
            `/projects/${issueData.projectId}/issues/${created.iid}/time_estimate?duration=${encodeURIComponent(duration)}`,
            'POST'
          );
        } catch (e) {
          console.warn('Failed to set time estimate via API:', e);
        }
      }

      // 4) Attempt to set iteration via REST update; fallback to GraphQL if needed
      if (issueData.iteration_id && created?.iid) {
        let iterationSet = false;
        try {
          await client.makeRequest<GitLabIssue>(
            `/projects/${issueData.projectId}/issues/${created.iid}`,
            'PUT',
            { iteration_id: issueData.iteration_id }
          );
          iterationSet = true;
        } catch (e) {
          console.warn('REST iteration update failed; attempting GraphQL fallback...', e);
        }

        if (!iterationSet) {
          try {
            // Fetch project to get path_with_namespace for GraphQL
            const project = await client.makeRequest<GitLabProject>(
              `/projects/${issueData.projectId}`,
              'GET'
            );

            const graphqlEndpoint = `${credentials.host.replace(/\/$/, '')}/api/graphql`;
            const iterationGID = `gid://gitlab/Iteration/${issueData.iteration_id}`;
            const mutation = `mutation UpdateIssueIteration($projectPath: ID!, $iid: String!, $iterationId: ID!) {\n  updateIssue(input: { projectPath: $projectPath, iid: $iid, iterationId: $iterationId }) {\n    issue { iid iteration { id title } }\n    errors\n  }\n}`;
            const variables = {
              projectPath: project.path_with_namespace,
              iid: String(created.iid),
              iterationId: iterationGID,
            };

            const resp = await fetch(graphqlEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: mutation, variables }),
            });

            if (!resp.ok) {
              throw new Error(`GraphQL HTTP error ${resp.status} ${resp.statusText}`);
            }
            const data = await resp.json();
            const errors = data?.data?.updateIssue?.errors;
            if (errors && errors.length) {
              console.warn('GraphQL updateIssue returned errors:', errors);
            } else {
              iterationSet = true;
            }
          } catch (err) {
            console.warn('GraphQL fallback to set iteration failed:', err);
          }
        }
      }

      return created;
    },
    onSuccess: () => {
      // Invalidate and refetch issues and related data
      queryClient.invalidateQueries({ queryKey: ['gitlab-issues'] });
      queryClient.invalidateQueries({ queryKey: ['gitlab-users'] });
      queryClient.invalidateQueries({ queryKey: ['gitlab-group'] });
      queryClient.invalidateQueries({ queryKey: ['gitlab-project-labels'] });
    },
  });
};

/**
 * Hook to fetch iterations for the current group
 */
export const useGitLabIterations = (credentials: GitLabCredentials | null) => {
  return useQuery({
    queryKey: ['gitlab-iterations', credentials?.groupId],
    queryFn: async (): Promise<GitLabIteration[]> => {
      if (!credentials) throw new Error('No credentials provided');
      
      const client = createGitLabClient(credentials);
      return client.makeRequest<GitLabIteration[]>(
        `/groups/${credentials.groupId}/iterations?state=opened&per_page=100`
      );
    },
    enabled: !!credentials,
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch iterations for a specific project (ancestor group iterations).
 * Ensures the iteration belongs to the selected project's group.
 */
export const useGitLabProjectIterations = (
  credentials: GitLabCredentials | null,
  projectId: number | null
) => {
  return useQuery({
    queryKey: ['gitlab-project-iterations', projectId],
    queryFn: async (): Promise<GitLabIteration[]> => {
      if (!credentials) throw new Error('No credentials provided');
      if (!projectId) return [];
      const client = createGitLabClient(credentials);
      return client.makeRequest<GitLabIteration[]>(
        `/projects/${projectId}/iterations?state=opened&per_page=100`
      );
    },
    enabled: !!credentials && !!projectId,
    refetchOnWindowFocus: false,
  });
};