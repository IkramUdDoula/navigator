import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanCard } from '../KanbanCard';
import { GitLabIssue } from '@/types/gitlab';

// Mock issue for testing
const mockIssue: GitLabIssue = {
  id: 1,
  iid: 123,
  title: 'Test Issue Title',
  description: 'Test description',
  state: 'opened',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  labels: ['Status::In Progress', 'Priority::High'],
  assignees: [{
    id: 1,
    username: 'testuser',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  }],
  author: {
    id: 1,
    username: 'author',
    name: 'Author User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  web_url: 'https://gitlab.com/test/issue/123',
  time_stats: {
    time_estimate: 7200, // 2 hours
    total_time_spent: 3600 // 1 hour
  }
};

describe('KanbanCard', () => {
  it('renders issue information correctly', () => {
    render(<KanbanCard issue={mockIssue} />);
    
    // Check if issue ID is displayed
    expect(screen.getByText('#123')).toBeInTheDocument();
    
    // Check if title is displayed
    expect(screen.getByText('Test Issue Title')).toBeInTheDocument();
    
    // Check if assignee name is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    // Check if estimated time is displayed
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('handles unassigned issues', () => {
    const unassignedIssue = { ...mockIssue, assignees: [] };
    render(<KanbanCard issue={unassignedIssue} />);
    
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('handles issues with no time estimate', () => {
    const noEstimateIssue = { ...mockIssue, time_stats: { time_estimate: 0, total_time_spent: 0 } };
    render(<KanbanCard issue={noEstimateIssue} />);
    
    expect(screen.getByText('No estimate')).toBeInTheDocument();
  });
});