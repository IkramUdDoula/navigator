import { GitLabIssue } from '@/types/gitlab';

// Define the grouping categories
export type GroupingCategory = 'iteration' | 'assignee' | 'status' | 'epic';

// Define the structure for grouped issues
export type GroupedIssues = {
  [key: string]: GroupedIssues | GitLabIssue[];
} | GitLabIssue[];

// Define the structure for group metadata
export interface GroupMetadata {
  name: string;
  issueCount: number;
  totalEstimate: number; // in hours
  totalTimeSpent: number; // in hours
  remainingTime: number; // in hours
}

// Define the result structure
export interface GroupedResult {
  data: GroupedIssues;
  hierarchy: GroupingCategory[];
  level: number;
}

/**
 * Main function to group issues based on selected categories
 * @param categories - Array of selected grouping categories
 * @param issues - Array of GitLab issues to group
 * @returns GroupedResult with data, hierarchy, and level information
 */
export function groupIssues(categories: GroupingCategory[], issues: GitLabIssue[]): GroupedResult {
  // Handle flat list case
  if (categories.length === 0) {
    return {
      data: issues,
      hierarchy: [],
      level: 0
    };
  }
  
  // Process categories in a fixed order to ensure consistent grouping
  const orderedCategories = orderCategories(categories);
  
  // Handle grouping cases
  const result = recursiveGrouping(issues, orderedCategories, 0);
  
  return {
    data: result,
    hierarchy: orderedCategories,
    level: orderedCategories.length
  };
}

/**
 * Order categories in a fixed order to ensure consistent grouping
 * @param categories - Array of selected grouping categories
 * @returns Ordered array of grouping categories
 */
function orderCategories(categories: GroupingCategory[]): GroupingCategory[] {
  const order: GroupingCategory[] = ['iteration', 'status', 'epic', 'assignee'];
  return order.filter(category => categories.includes(category));
}

/**
 * Recursively group issues based on categories
 * @param issues - Array of GitLab issues to group
 * @param categories - Ordered array of grouping categories
 * @param level - Current grouping level
 * @returns Grouped issues structure
 */
function recursiveGrouping(
  issues: GitLabIssue[],
  categories: GroupingCategory[],
  level: number
): GroupedIssues {
  // Base case: if we've processed all categories, return the issues
  if (level >= categories.length) {
    return issues;
  }
  
  // Get the current category to group by
  const currentCategory = categories[level];
  
  // Group issues by the current category
  const grouped: { [key: string]: GitLabIssue[] } = {};
  
  for (const issue of issues) {
    const groupName = getGroupName(issue, currentCategory);
    if (!grouped[groupName]) {
      grouped[groupName] = [];
    }
    grouped[groupName].push(issue);
  }
  
  // If this is the last category, return the grouped issues
  if (level === categories.length - 1) {
    return grouped;
  }
  
  // Otherwise, recursively group each subgroup
  const result: { [key: string]: GroupedIssues } = {};
  for (const [groupName, groupIssues] of Object.entries(grouped)) {
    result[groupName] = recursiveGrouping(groupIssues, categories, level + 1);
  }
  
  return result;
}

/**
 * Get the group name for an issue based on the category
 * @param issue - GitLab issue
 * @param category - Grouping category
 * @returns Group name as string
 */
function getGroupName(issue: GitLabIssue, category: GroupingCategory): string {
  switch (category) {
    case 'iteration':
      return issue.iteration?.title || 'No Iteration';
    case 'assignee':
      return issue.assignees && issue.assignees.length > 0 
        ? issue.assignees[0].name 
        : 'Unassigned';
    case 'status':
      return issue.state || 'Unknown';
    case 'epic':
      // Implementation for epic/parent grouping
      if (issue.epic) {
        return issue.epic.title || 'Epic: No Title';
      } else if (issue.parent) {
        return issue.parent.title || `Parent: #${issue.parent.iid}`;
      } else {
        return 'No Epic/Parent';
      }
    default:
      return 'Unknown';
  }
}

/**
 * Get metadata for a group
 * @param group - Grouped issues or array of issues
 * @returns GroupMetadata with count, estimates, and time information
 */
export function getGroupMetadata(group: GroupedIssues): GroupMetadata {
  // If it's an array of issues, calculate metadata directly
  if (Array.isArray(group)) {
    let issueCount = 0;
    let totalEstimate = 0;
    let totalTimeSpent = 0;
    
    for (const issue of group) {
      issueCount++;
      const timeStats = issue.time_stats || { time_estimate: 0, total_time_spent: 0 };
      totalEstimate += timeStats.time_estimate || 0;
      totalTimeSpent += timeStats.total_time_spent || 0;
    }
    
    const remainingTime = Math.max(0, totalEstimate - totalTimeSpent);
    
    return {
      name: '',
      issueCount,
      totalEstimate: totalEstimate / 3600, // Convert to hours
      totalTimeSpent: totalTimeSpent / 3600, // Convert to hours
      remainingTime: remainingTime / 3600 // Convert to hours
    };
  }
  
  // If it's a grouped object, recursively calculate metadata
  let issueCount = 0;
  let totalEstimate = 0;
  let totalTimeSpent = 0;
  
  for (const subgroup of Object.values(group)) {
    const metadata = getGroupMetadata(subgroup);
    issueCount += metadata.issueCount;
    totalEstimate += metadata.totalEstimate * 3600; // Convert back to seconds for calculation
    totalTimeSpent += metadata.totalTimeSpent * 3600; // Convert back to seconds for calculation
  }
  
  const remainingTime = Math.max(0, totalEstimate - totalTimeSpent);
  
  return {
    name: '',
    issueCount,
    totalEstimate: totalEstimate / 3600, // Convert to hours
    totalTimeSpent: totalTimeSpent / 3600, // Convert to hours
    remainingTime: remainingTime / 3600 // Convert to hours
  };
}