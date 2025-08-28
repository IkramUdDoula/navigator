import { useQuery } from '@tanstack/react-query';
import { GitLabCredentials, GitLabIssue, GitLabUser } from '@/types/gitlab';

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