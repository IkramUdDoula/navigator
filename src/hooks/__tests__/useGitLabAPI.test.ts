import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useGitLabGroupProjects, 
  useCreateGitLabIssue 
} from '../useGitLabAPI';
import { GitLabCredentials } from '@/types/gitlab';

const mockCredentials: GitLabCredentials = {
  host: 'https://gitlab.example.com',
  token: 'test-token',
  groupId: 'test-group'
};

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('GitLab API Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('useGitLabGroupProjects', () => {
    it('should fetch group projects successfully', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1', path_with_namespace: 'group/project1' },
        { id: 2, name: 'Project 2', path_with_namespace: 'group/project2' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProjects)
      });

      const { result } = renderHook(
        () => useGitLabGroupProjects(mockCredentials),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProjects);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/groups/test-group/projects?per_page=100&simple=true&archived=false',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const { result } = renderHook(
        () => useGitLabGroupProjects(mockCredentials),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should not fetch when credentials are null', () => {
      const { result } = renderHook(
        () => useGitLabGroupProjects(null),
        { wrapper: createWrapper() }
      );

      expect(result.current.isIdle).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('useCreateGitLabIssue', () => {
    it('should create issue successfully', async () => {
      const mockIssue = { 
        id: 1, 
        iid: 1, 
        title: 'Test Issue',
        state: 'opened'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue)
      });

      const { result } = renderHook(
        () => useCreateGitLabIssue(mockCredentials),
        { wrapper: createWrapper() }
      );

      const issueData = {
        projectId: 1,
        title: 'Test Issue',
        description: 'Test description'
      };

      await result.current.mutateAsync(issueData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gitlab.example.com/api/v4/projects/1/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(issueData)
        })
      );
    });

    it('should handle creation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const { result } = renderHook(
        () => useCreateGitLabIssue(mockCredentials),
        { wrapper: createWrapper() }
      );

      const issueData = {
        projectId: 1,
        title: 'Test Issue'
      };

      await expect(result.current.mutateAsync(issueData)).rejects.toThrow(
        'GitLab API Error: 400 Bad Request'
      );
    });

    it('should throw error when credentials are null', async () => {
      const { result } = renderHook(
        () => useCreateGitLabIssue(null),
        { wrapper: createWrapper() }
      );

      const issueData = {
        projectId: 1,
        title: 'Test Issue'
      };

      await expect(result.current.mutateAsync(issueData)).rejects.toThrow(
        'No credentials provided'
      );
    });
  });
});