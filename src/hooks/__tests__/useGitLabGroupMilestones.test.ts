import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGitLabGroupMilestones } from '../useGitLabAPI';
import { GitLabCredentials, GitLabMilestone } from '@/types/gitlab';

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

describe('useGitLabGroupMilestones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should fetch group milestones successfully', async () => {
    const mockMilestones: GitLabMilestone[] = [
      { 
        id: 1, 
        title: 'Milestone 1', 
        state: 'active',
        start_date: '2023-01-01',
        due_date: '2023-12-31',
        description: 'First milestone'
      },
      { 
        id: 2, 
        title: 'Milestone 2', 
        state: 'closed',
        start_date: '2022-01-01',
        due_date: '2022-12-31',
        description: 'Second milestone'
      }
    ];

    // Mock responses for each state request
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockMilestones[0]])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockMilestones[1]])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

    const { result } = renderHook(
      () => useGitLabGroupMilestones(mockCredentials),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should have combined all milestones
    expect(result.current.data).toEqual(mockMilestones);
    
    // Should have made requests for each state
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://gitlab.example.com/api/v4/groups/test-group/milestones?state=active&per_page=100',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock all requests to fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const { result } = renderHook(
      () => useGitLabGroupMilestones(mockCredentials),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should return empty array when all requests fail
    expect(result.current.data).toEqual([]);
  });

  it('should handle partial fetch errors', async () => {
    const mockMilestones: GitLabMilestone[] = [
      { 
        id: 1, 
        title: 'Milestone 1', 
        state: 'active',
        start_date: '2023-01-01',
        due_date: '2023-12-31',
        description: 'First milestone'
      }
    ];

    // Mock first request to succeed, others to fail
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMilestones)
      })
      .mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

    const { result } = renderHook(
      () => useGitLabGroupMilestones(mockCredentials),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should return only the successful milestones
    expect(result.current.data).toEqual(mockMilestones);
  });

  it('should remove duplicate milestones', async () => {
    const mockMilestone: GitLabMilestone = { 
      id: 1, 
      title: 'Milestone 1', 
      state: 'active',
      start_date: '2023-01-01',
      due_date: '2023-12-31',
      description: 'First milestone'
    };

    // Mock responses with the same milestone in different states
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockMilestone])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockMilestone])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

    const { result } = renderHook(
      () => useGitLabGroupMilestones(mockCredentials),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should have only one milestone despite duplicates
    expect(result.current.data).toEqual([mockMilestone]);
    expect(result.current.data?.length).toBe(1);
  });

  it('should not fetch when credentials are null', () => {
    const { result } = renderHook(
      () => useGitLabGroupMilestones(null),
      { wrapper: createWrapper() }
    );

    expect(result.current.isIdle).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});