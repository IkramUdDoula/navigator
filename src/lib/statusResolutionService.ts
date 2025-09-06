import { GitLabIssue, ResolvedStatus, GitLabLabel } from '@/types/gitlab';

/**
 * StatusResolutionService class provides enhanced status resolution for GitLab issues
 * Combines information from both labels and issue state following a priority hierarchy:
 * 1. Status:: labels (highest priority)
 * 2. Issue state (fallback)
 */
export class StatusResolutionService {
  /**
   * Resolve issue status with enhanced information
   * @param issue - GitLab issue to resolve status for
   * @param colorMapping - Optional color mapping for status labels
   * @returns Resolved status with enhanced information
   */
  static resolveIssueStatus(
    issue: GitLabIssue, 
    colorMapping?: Record<string, string>
  ): ResolvedStatus {
    // Priority 1: Check for Status:: labels
    const statusLabel = this.extractStatusLabel(issue.labels);
    if (statusLabel) {
      const statusName = this.formatStatusName(statusLabel);
      const color = colorMapping?.[statusName];
      
      return {
        name: statusName,
        source: 'label',
        category: 'opened', // Status:: labels always indicate opened issues in different stages
        color,
        originalLabel: statusLabel
      };
    }
    
    // Priority 2: Fallback to issue state
    return {
      name: issue.state === 'closed' ? 'Closed' : 'Opened',
      source: 'state',
      category: issue.state === 'closed' ? 'closed' : 'opened'
    };
  }
  
  /**
   * Resolve status for multiple issues at once
   * @param issues - Array of GitLab issues
   * @param colorMapping - Optional color mapping for status labels
   * @returns Array of issues with resolved status
   */
  static resolveMultipleIssuesStatus(
    issues: GitLabIssue[], 
    colorMapping?: Record<string, string>
  ): GitLabIssue[] {
    return issues.map(issue => ({
      ...issue,
      resolved_status: this.resolveIssueStatus(issue, colorMapping)
    }));
  }
  
  /**
   * Check if an issue has a Status:: label
   * @param issue - GitLab issue to check
   * @returns True if issue has Status:: label
   */
  static hasStatusLabel(issue: GitLabIssue): boolean {
    return this.extractStatusLabel(issue.labels) !== null;
  }
  
  /**
   * Get unique status names from a collection of issues
   * @param issues - Array of GitLab issues
   * @param colorMapping - Optional color mapping for status labels
   * @returns Array of unique status names
   */
  static getUniqueStatuses(
    issues: GitLabIssue[], 
    colorMapping?: Record<string, string>
  ): string[] {
    const statuses = new Set<string>();
    
    issues.forEach(issue => {
      const resolvedStatus = this.resolveIssueStatus(issue, colorMapping);
      statuses.add(resolvedStatus.name);
    });
    
    return Array.from(statuses).sort();
  }
  
  /**
   * Extract Status:: label from issue labels
   * @param labels - Array of label strings
   * @returns First Status:: label found or null
   */
  private static extractStatusLabel(labels: string[]): string | null {
    if (!labels || !Array.isArray(labels)) {
      return null;
    }
    
    return labels.find(label => 
      label && typeof label === 'string' && label.startsWith('Status::')
    ) || null;
  }
  
  /**
   * Format status name by removing Status:: prefix and processing HTML entities
   * @param statusLabel - Status label with Status:: prefix
   * @returns Formatted status name
   */
  private static formatStatusName(statusLabel: string): string {
    if (!statusLabel) return '';
    
    // Remove Status:: prefix
    let formatted = statusLabel.replace('Status::', '').trim();
    
    // Decode common HTML entities that might appear in GitLab labels
    formatted = formatted
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\\u0026/g, '&'); // Handle Unicode encoded ampersand
    
    return formatted;
  }
  
  /**
   * Process GitLab label data to extract status information
   * @param labels - Array of GitLab labels
   * @returns Status label data with color mapping
   */
  static processLabelData(labels: GitLabLabel[]): { 
    statusLabels: GitLabLabel[], 
    colorMapping: Record<string, string> 
  } {
    if (!labels || !Array.isArray(labels)) {
      return { statusLabels: [], colorMapping: {} };
    }
    
    const statusLabels = labels.filter(label => 
      label && 
      label.title && 
      typeof label.title === 'string' && 
      label.title.startsWith('Status::')
    );
    
    const colorMapping: Record<string, string> = {};
    statusLabels.forEach(label => {
      if (label && label.title) {
        const statusName = this.formatStatusName(label.title);
        let color = label.color || '';
        
        // Normalize color format
        if (color && !color.startsWith('#')) {
          color = `#${color}`;
        }
        
        if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
          colorMapping[statusName] = color;
        }
      }
    });
    
    return { statusLabels, colorMapping };
  }
  
  /**
   * Get fallback colors for common status names when GitLab doesn't provide colors
   * @param statusName - Status name
   * @returns Hex color string or null
   */
  static getFallbackColor(statusName: string): string | null {
    const fallbackColors: Record<string, string> = {
      'to do': '#6c757d',       // Gray
      'todo': '#6c757d',        // Gray
      'backlog': '#6c757d',     // Gray
      'in progress': '#0d6efd',  // Blue
      'in-progress': '#0d6efd',  // Blue
      'doing': '#0d6efd',       // Blue
      'in review': '#fd7e14',   // Orange/Amber
      'in-review': '#fd7e14',   // Orange/Amber
      'review': '#fd7e14',      // Orange/Amber
      'testing': '#6f42c1',     // Purple
      'qa': '#6f42c1',          // Purple
      'done': '#198754',        // Green
      'completed': '#198754',   // Green
      'closed': '#6c757d',      // Gray
      'blocked': '#dc3545',     // Red
      'waiting': '#ffc107'      // Yellow
    };
    
    const normalized = statusName.toLowerCase().trim();
    return fallbackColors[normalized] || null;
  }
}