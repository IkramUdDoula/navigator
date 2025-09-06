import { StatusResolutionService } from '@/lib/statusResolutionService';
import { GitLabIssue, GitLabLabel, ResolvedStatus } from '@/types/gitlab';

// Mock GitLab issue data for testing
const createMockIssue = (overrides: Partial<GitLabIssue> = {}): GitLabIssue => ({
  id: 1,
  iid: 1,
  title: 'Test Issue',
  description: 'Test description',
  state: 'opened',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  labels: [],
  assignees: [],
  author: {
    id: 1,
    username: 'testuser',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  web_url: 'https://gitlab.example.com/group/project/-/issues/1',
  ...overrides
});

// Mock GitLab label data for testing
const createMockLabel = (overrides: Partial<GitLabLabel> = {}): GitLabLabel => ({
  id: '1',
  title: 'Status::To Do',
  color: '6c757d',
  description: 'Work to be done',
  ...overrides
});

describe('StatusResolutionService', () => {
  describe('resolveIssueStatus', () => {
    it('should extract status from Status:: labels', () => {
      const issue = createMockIssue({
        labels: ['Status::To Do', 'bug'],
        state: 'opened'
      });
      
      const result = StatusResolutionService.resolveIssueStatus(issue);
      
      expect(result.name).toBe('To Do');
      expect(result.source).toBe('label');
      expect(result.category).toBe('opened');
      expect(result.originalLabel).toBe('Status::To Do');
    });
    
    it('should fallback to issue state when no Status:: labels', () => {
      const issue = createMockIssue({
        labels: ['bug', 'enhancement'],
        state: 'closed'
      });
      
      const result = StatusResolutionService.resolveIssueStatus(issue);
      
      expect(result.name).toBe('Closed');
      expect(result.source).toBe('state');
      expect(result.category).toBe('closed');
      expect(result.originalLabel).toBeUndefined();
    });
    
    it('should handle opened state fallback', () => {
      const issue = createMockIssue({
        labels: ['bug'],
        state: 'opened'
      });
      
      const result = StatusResolutionService.resolveIssueStatus(issue);
      
      expect(result.name).toBe('Opened');
      expect(result.source).toBe('state');
      expect(result.category).toBe('opened');
    });
    
    it('should use color mapping when provided', () => {
      const issue = createMockIssue({
        labels: ['Status::In Progress'],
        state: 'opened'
      });
      
      const colorMapping = {
        'In Progress': '#0d6efd'
      };
      
      const result = StatusResolutionService.resolveIssueStatus(issue, colorMapping);
      
      expect(result.name).toBe('In Progress');
      expect(result.color).toBe('#0d6efd');
    });
    
    it('should handle multiple Status:: labels and use the first one', () => {
      const issue = createMockIssue({
        labels: ['Status::To Do', 'Status::In Progress', 'bug'],
        state: 'opened'
      });
      
      const result = StatusResolutionService.resolveIssueStatus(issue);
      
      expect(result.name).toBe('To Do');
      expect(result.originalLabel).toBe('Status::To Do');
    });
    
    it('should handle HTML entities in status labels', () => {
      const issue = createMockIssue({
        labels: ['Status::QA &amp; Testing'],
        state: 'opened'
      });
      
      const result = StatusResolutionService.resolveIssueStatus(issue);
      
      expect(result.name).toBe('QA & Testing');
    });
    
    it('should handle Unicode entities in status labels', () => {
      const issue = createMockIssue({
        labels: ['Status::Review \\\\u0026 Deploy'],
        state: 'opened'
      });
      
      const result = StatusResolutionService.resolveIssueStatus(issue);
      
      expect(result.name).toBe('Review & Deploy');
    });
  });
  
  describe('resolveMultipleIssuesStatus', () => {
    it('should resolve status for multiple issues', () => {
      const issues = [
        createMockIssue({ labels: ['Status::To Do'], state: 'opened' }),
        createMockIssue({ labels: ['Status::In Progress'], state: 'opened' }),
        createMockIssue({ labels: [], state: 'closed' })
      ];
      
      const result = StatusResolutionService.resolveMultipleIssuesStatus(issues);
      
      expect(result).toHaveLength(3);
      expect(result[0].resolved_status?.name).toBe('To Do');
      expect(result[1].resolved_status?.name).toBe('In Progress');
      expect(result[2].resolved_status?.name).toBe('Closed');
    });
  });
  
  describe('hasStatusLabel', () => {
    it('should return true when issue has Status:: label', () => {
      const issue = createMockIssue({
        labels: ['Status::To Do', 'bug']
      });
      
      const result = StatusResolutionService.hasStatusLabel(issue);
      
      expect(result).toBe(true);
    });
    
    it('should return false when issue has no Status:: label', () => {
      const issue = createMockIssue({
        labels: ['bug', 'enhancement']
      });
      
      const result = StatusResolutionService.hasStatusLabel(issue);
      
      expect(result).toBe(false);
    });
  });
  
  describe('getUniqueStatuses', () => {
    it('should return unique status names', () => {
      const issues = [
        createMockIssue({ labels: ['Status::To Do'], state: 'opened' }),
        createMockIssue({ labels: ['Status::To Do'], state: 'opened' }),
        createMockIssue({ labels: ['Status::In Progress'], state: 'opened' }),
        createMockIssue({ labels: [], state: 'closed' })
      ];
      
      const result = StatusResolutionService.getUniqueStatuses(issues);
      
      expect(result).toEqual(['Closed', 'In Progress', 'To Do']);
    });
  });
  
  describe('processLabelData', () => {
    it('should process GitLab labels and extract status information', () => {
      const labels = [
        createMockLabel({ title: 'Status::To Do', color: '6c757d' }),
        createMockLabel({ title: 'Status::In Progress', color: '0d6efd' }),
        createMockLabel({ title: 'bug', color: 'ff0000' }), // Non-status label
      ];
      
      const result = StatusResolutionService.processLabelData(labels);
      
      expect(result.statusLabels).toHaveLength(2);
      expect(result.colorMapping).toEqual({
        'To Do': '#6c757d',
        'In Progress': '#0d6efd'
      });
    });
    
    it('should handle labels without colors', () => {
      const labels = [
        createMockLabel({ title: 'Status::To Do', color: '' }),
        createMockLabel({ title: 'Status::In Progress' }), // No color property
      ];
      
      const result = StatusResolutionService.processLabelData(labels);
      
      expect(result.statusLabels).toHaveLength(2);
      expect(result.colorMapping).toEqual({});
    });
    
    it('should handle empty or invalid labels array', () => {
      expect(StatusResolutionService.processLabelData([])).toEqual({
        statusLabels: [],
        colorMapping: {}
      });
      
      expect(StatusResolutionService.processLabelData(null as any)).toEqual({
        statusLabels: [],
        colorMapping: {}
      });
    });
  });
  
  describe('getFallbackColor', () => {
    it('should return fallback colors for common status names', () => {
      expect(StatusResolutionService.getFallbackColor('To Do')).toBe('#6c757d');
      expect(StatusResolutionService.getFallbackColor('in progress')).toBe('#0d6efd');
      expect(StatusResolutionService.getFallbackColor('IN REVIEW')).toBe('#fd7e14');
      expect(StatusResolutionService.getFallbackColor('done')).toBe('#198754');
    });
    
    it('should return null for unknown status names', () => {
      expect(StatusResolutionService.getFallbackColor('Unknown Status')).toBeNull();
    });
    
    it('should handle case insensitive matching', () => {
      expect(StatusResolutionService.getFallbackColor('TO DO')).toBe('#6c757d');
      expect(StatusResolutionService.getFallbackColor('In Progress')).toBe('#0d6efd');
    });
  });
});