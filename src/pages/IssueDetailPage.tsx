import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, ExternalLink, Calendar, User, Tag, Clock, AlertCircle, Search, ChevronDown, ChevronUp, Target, Flag, GitBranch, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { 
  useGitLabIssue, 
  useUpdateGitLabIssue, 
  useGitLabUsers, 
  useGitLabGroupMilestones,
  useGitLabProjectLabels,
  useGitLabIterations,
  useGitLabEpics,
  useGitLabIssues,
  UpdateIssueRequest
} from '@/hooks/useGitLabAPI';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { GitLabCredentials, GitLabIssue } from '@/types/gitlab';

interface IssueDetailPageProps {
  credentials?: GitLabCredentials | null;
}

const IssueDetailPage: React.FC<IssueDetailPageProps> = ({ credentials: propCredentials }) => {
  const { projectId, issueIid } = useParams<{ projectId: string; issueIid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get the source tab and edit mode from URL query params
  const location = window.location;
  const urlParams = new URLSearchParams(location.search);
  const sourceTab = urlParams.get('from') || '/';
  const shouldStartEditing = urlParams.get('edit') === 'true';
  
  // Get credentials from localStorage if not provided as prop
  const [storedCredentials] = useLocalStorage<GitLabCredentials | null>('gitlab-credentials', null);
  const credentials = propCredentials || storedCredentials;
  
  // Parse URL parameters
  const decodedProjectPath = projectId ? decodeURIComponent(projectId) : null;
  const parsedIssueIid = issueIid ? parseInt(issueIid, 10) : null;
  
  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [activityExpanded, setActivityExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    assignee_ids: [] as number[],
    milestone_id: null as number | null,
    labels: [] as string[],
    time_estimate: 0,
    time_spent: 0,
    iteration_id: null as number | null,
    epic_id: null as number | null,
  });

  // Fetch data
  const { data: issue, isLoading, error, refetch } = useGitLabIssue(credentials, decodedProjectPath, parsedIssueIid);
  
  // Enhanced debugging for URL parsing and routing
  console.log('🔍 IssueDetailPage Debug:', {
    rawParams: { projectId, issueIid },
    decodedProjectPath,
    parsedIssueIid,
    credentials: !!credentials,
    credentialsHost: credentials?.host,
    credentialsGroupId: credentials?.groupId,
    urlInfo: {
      pathname: location.pathname,
      search: location.search,
      href: location.href
    },
    queryParams: {
      sourceTab,
      shouldStartEditing
    },
    issueData: issue ? {
      id: issue.id,
      iid: issue.iid,
      title: issue.title,
      state: issue.state,
      web_url: issue.web_url
    } : null,
    loadingState: { isLoading, hasError: !!error },
    error: error?.message,
    timestamp: new Date().toISOString()
  });

  // Log when parameters change
  useEffect(() => {
    console.log('📍 Route parameters changed:', {
      projectId,
      issueIid,
      decodedProjectPath,
      parsedIssueIid
    });
  }, [projectId, issueIid, decodedProjectPath, parsedIssueIid]);

  // Log when issue data loads successfully
  useEffect(() => {
    if (issue && !isLoading && !error) {
      console.log('🎉 Issue loaded successfully!', {
        issueId: issue.id,
        issueIid: issue.iid,
        title: issue.title,
        state: issue.state,
        projectPath: decodedProjectPath,
        assignees: issue.assignees?.length || 0,
        labels: issue.labels?.length || 0,
        milestone: issue.milestone?.title || 'None'
      });
    }
  }, [issue, isLoading, error, decodedProjectPath]);
  const { data: users = [] } = useGitLabUsers(credentials);
  const { data: milestones = [] } = useGitLabGroupMilestones(credentials);
  const { data: projectLabels = [] } = useGitLabProjectLabels(credentials);
  const { data: allIssues = [] } = useGitLabIssues(credentials);
  const { data: iterations = [] } = useGitLabIterations(credentials);
  const { data: epics = [] } = useGitLabEpics(credentials);
  
  // Extract unique labels from existing issues as fallback (same approach as CreateIssueForm)
  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    allIssues.forEach(issue => {
      issue.labels.forEach(label => {
        labels.add(label);
      });
    });
    return Array.from(labels).sort();
  }, [allIssues]);
  
  // Filtered labels based on search (similar to CreateIssueForm)
  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return allLabels;
    return allLabels.filter(label => 
      label.toLowerCase().includes(labelSearch.toLowerCase())
    );
  }, [allLabels, labelSearch]);

  // Filtered assignees based on search
  const filteredUsers = useMemo(() => {
    if (!assigneeSearch.trim()) return users;
    return users.filter(user => 
      user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    );
  }, [users, assigneeSearch]);
  
  // Update mutation
  const updateIssueMutation = useUpdateGitLabIssue(credentials);

  // Initialize edit form when issue data is loaded
  useEffect(() => {
    if (issue && !isEditing) {
      setEditForm({
        title: issue.title,
        description: issue.description || '',
        assignee_ids: issue.assignees.map(a => a.id),
        milestone_id: issue.milestone?.id || null,
        labels: issue.labels,
        time_estimate: issue.time_stats?.time_estimate || 0,
        time_spent: issue.time_stats?.total_time_spent || 0,
        iteration_id: issue.iteration?.id || null,
        epic_id: issue.epic?.id || null,
      });
    }
  }, [issue, isEditing]);

  // Auto-start editing if URL parameter is set
  useEffect(() => {
    if (shouldStartEditing && issue && !isEditing) {
      setIsEditing(true);
    }
  }, [shouldStartEditing, issue, isEditing]);

  // Real-time updates are handled by React Query polling (configured in the hook)

  const handleSave = async () => {
    if (!issue || !decodedProjectPath || !parsedIssueIid) return;

    try {
      const updateData: UpdateIssueRequest = {
        projectId: decodedProjectPath,
        issueIid: parsedIssueIid,
        title: editForm.title,
        description: editForm.description,
        assignee_ids: editForm.assignee_ids,
        milestone_id: editForm.milestone_id,
        labels: editForm.labels,
        time_estimate: editForm.time_estimate,
        time_spent: editForm.time_spent,
        iteration_id: editForm.iteration_id,
        epic_id: editForm.epic_id,
      };

      await updateIssueMutation.mutateAsync(updateData);
      
      toast({
        title: "Issue Updated",
        description: "The issue has been successfully updated.",
      });
      
      setLabelSearch(''); // Clear label search when saving
      setAssigneeSearch(''); // Clear assignee search when saving
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update the issue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (issue) {
      setEditForm({
        title: issue.title,
        description: issue.description || '',
        assignee_ids: issue.assignees.map(a => a.id),
        milestone_id: issue.milestone?.id || null,
        labels: issue.labels,
        time_estimate: issue.time_stats?.time_estimate || 0,
        time_spent: issue.time_stats?.total_time_spent || 0,
        iteration_id: issue.iteration?.id || null,
        epic_id: issue.epic?.id || null,
      });
    }
    setLabelSearch(''); // Clear label search when canceling
    setAssigneeSearch(''); // Clear assignee search when canceling
    setIsEditing(false);
  };

  const formatTimeEstimate = (seconds: number): string => {
    if (seconds === 0) return 'No estimate';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateName = (name: string, maxLength: number = 12): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, -maxLength);
  };

 
  // Generate activity log from issue data
  const activityLog = React.useMemo(() => {
    if (!issue) return [];
    
    const activities = [
      {
        id: 'created',
        type: 'created',
        user: issue.author,
        timestamp: issue.created_at,
        description: 'created this issue'
      },
      {
        id: 'updated',
        type: 'updated',
        user: issue.author,
        timestamp: issue.updated_at,
        description: 'updated this issue'
      }
    ];

    // Add assignee activities
    if (issue.assignees.length > 0) {
      activities.push({
        id: 'assigned',
        type: 'assigned',
        user: issue.assignees[0],
        timestamp: issue.created_at,
        description: `assigned to ${issue.assignees.map(a => a.name).join(', ')}`
      });
    }

    // Add label activities
    if (issue.labels.length > 0) {
      activities.push({
        id: 'labeled',
        type: 'labeled',
        user: issue.author,
        timestamp: issue.created_at,
        description: `added labels: ${issue.labels.join(', ')}`
      });
    }

    // Sort by timestamp descending
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [issue]);

  // Chip management functions
  const addLabel = (label: string) => {
    if (!editForm.labels.includes(label)) {
      setEditForm(prev => ({ ...prev, labels: [...prev.labels, label] }));
    }
  };

  const removeLabel = (label: string) => {
    setEditForm(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }));
  };

  const addAssignee = (userId: number) => {
    if (!editForm.assignee_ids.includes(userId)) {
      setEditForm(prev => ({ ...prev, assignee_ids: [...prev.assignee_ids, userId] }));
    }
  };

  const removeAssignee = (userId: number) => {
    setEditForm(prev => ({ ...prev, assignee_ids: prev.assignee_ids.filter(id => id !== userId) }));
  };

  // Handle closing/reopening issue
  const handleToggleIssueState = async () => {
    if (!issue || !decodedProjectPath || !parsedIssueIid) return;

    try {
      const newState = issue.state === 'opened' ? 'close' : 'reopen';
      const updateData: UpdateIssueRequest = {
        projectId: decodedProjectPath,
        issueIid: parsedIssueIid,
        state_event: newState,
      };

      await updateIssueMutation.mutateAsync(updateData);
      
      toast({
        title: `Issue ${newState === 'close' ? 'Closed' : 'Reopened'}`,
        description: `The issue has been ${newState === 'close' ? 'closed' : 'reopened'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: `Failed to ${issue.state === 'opened' ? 'close' : 'reopen'} the issue. Please try again.`,
        variant: "destructive",
      });
    }
  };

  if (!credentials) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please log in with your GitLab credentials to view issue details.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    // Store the current URL to redirect back after login
                    localStorage.setItem('redirect-after-login', window.location.href);
                    navigate('/');
                  }} 
                  className="w-full"
                >
                  Go to Login
                </Button>
                <p className="text-xs text-muted-foreground">
                  Issue: {decodedProjectPath}#{parsedIssueIid}
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll be redirected back here after logging in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading issue details...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Issue Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The requested issue could not be found. This could be because:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 text-left space-y-1">
                <li>• The issue doesn't exist</li>
                <li>• The project path is incorrect</li>
                <li>• You don't have permission to view it</li>
                <li>• The GitLab server is unreachable</li>
              </ul>
              <div className="space-y-2">
                <Button onClick={() => navigate(sourceTab)} className="w-full">
                  Back
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Project: {decodedProjectPath}</p>
                  <p>Issue IID: #{parsedIssueIid}</p>
                  {error && <p className="text-destructive">Error: {error.message}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Compact Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(sourceTab)}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2">
                <Badge 
                  variant={issue.state === 'opened' ? 'default' : 'secondary'}
                  className={`${issue.state === 'opened' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'} text-white font-medium`}
                >
                  {issue.state === 'opened' ? 'Open' : 'Closed'}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">#{issue.iid}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(issue.web_url, '_blank')}
                className="flex items-center gap-2 hover:bg-muted/50"
              >
                <ExternalLink className="h-4 w-4" />
                GitLab
              </Button>
              
              <Button
                variant={issue.state === 'opened' ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleIssueState}
                disabled={updateIssueMutation.isPending}
                className="flex items-center gap-2"
              >
                {issue.state === 'opened' ? 'Close' : 'Reopen'}
              </Button>
              
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={updateIssueMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateIssueMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4">
            {/* Title Section */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-4">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
                  placeholder="Issue title"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground leading-tight">{issue.title}</h1>
              )}
            </div>

            {/* Description */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Description
                </h2>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={8}
                    placeholder="Issue description"
                    className="min-h-[160px] border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {issue.description ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {issue.description}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground italic">No description provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Log */}
            <Collapsible open={activityExpanded} onOpenChange={setActivityExpanded}>
              <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
                <CollapsibleTrigger className="w-full p-4 border-b hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity ({activityLog.length})
                    </h2>
                    {activityExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4">
                    <div className="space-y-3">
                      {activityLog.map((activity, index) => (
                        <div key={activity.id} className={`flex gap-3 ${index !== activityLog.length - 1 ? 'pb-3 border-b border-muted/50' : ''}`}>
                          <Avatar className="h-7 w-7 ring-2 ring-background">
                            <AvatarImage src={activity.user.avatar_url} alt={activity.user.name} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{activity.user.name}</span>
                              <span className="text-xs text-muted-foreground">{activity.description}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Issue Summary */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Issue Summary
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge 
                    variant={issue.state === 'opened' ? 'default' : 'secondary'}
                    className={`${issue.state === 'opened' ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs`}
                  >
                    {issue.state === 'opened' ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <span className="text-xs">{formatDate(issue.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Updated</span>
                  <span className="text-xs">{formatDate(issue.updated_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Author</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={issue.author.avatar_url} alt={issue.author.name} />
                      <AvatarFallback className="text-xs">
                        {issue.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{issue.author.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignees */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
              <div className="p-3 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignees
                </h3>
              </div>
              <div className="p-3">
                <div className="space-y-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search assignees..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      {/* Assignee Chips */}
                      <div className="flex flex-wrap gap-2">
                        {filteredUsers.map(user => {
                          const isSelected = editForm.assignee_ids.includes(user.id);
                          return (
                            <Badge
                              key={user.id}
                              variant={isSelected ? "default" : "outline"}
                              className={`flex items-center gap-1 cursor-pointer hover:opacity-80 ${
                                isSelected ? 'bg-black text-white dark:bg-white dark:text-black' : ''
                              }`}
                              onClick={() => isSelected ? removeAssignee(user.id) : addAssignee(user.id)}
                            >
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={user.avatar_url} alt={user.name} />
                                <AvatarFallback className="text-xs">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{truncateName(user.name)}</span>
                            </Badge>
                          );
                        })}
                        {filteredUsers.length === 0 && assigneeSearch && (
                          <span className="text-muted-foreground text-sm">No assignees found matching "{assigneeSearch}"</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {issue.assignees.length > 0 ? (
                        issue.assignees.map(assignee => (
                          <Badge key={assignee.id} variant="secondary" className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={assignee.avatar_url} alt={assignee.name} />
                              <AvatarFallback className="text-xs">
                                {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{truncateName(assignee.name)}</span>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No assignees</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
              <div className="p-3 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </h3>
              </div>
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search labels..."
                        value={labelSearch}
                        onChange={(e) => setLabelSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Label Chips */}
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[2.5rem]">
                      {filteredLabels.map((label) => {
                        const isSelected = editForm.labels.includes(label);
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => isSelected ? removeLabel(label) : addLabel(label)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            <Tag className="h-3 w-3" />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                      {filteredLabels.length === 0 && labelSearch && (
                        <span className="text-muted-foreground text-sm">No labels found matching "{labelSearch}"</span>
                      )}
                      {allLabels.length === 0 && (
                        <span className="text-muted-foreground text-sm">No labels found in existing issues. Labels will be available after creating issues with labels.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {issue.labels.length > 0 ? (
                      issue.labels.map(label => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No labels</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Iteration */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
              <div className="p-3 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Iteration
                </h3>
              </div>
              <div className="p-3">
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {iterations.map(iteration => {
                      const isSelected = editForm.iteration_id === iteration.id;
                      return (
                        <Badge
                          key={iteration.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`text-xs cursor-pointer hover:opacity-80 ${
                            isSelected ? 'bg-black text-white dark:bg-white dark:text-black' : ''
                          }`}
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            iteration_id: isSelected ? null : iteration.id
                          }))}
                        >
                          {iteration.title}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {issue.iteration ? (
                      <Badge variant="outline" className="text-xs">
                        {issue.iteration.title}
                      </Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">No iteration</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Epic */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
              <div className="p-3 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Epic
                </h3>
              </div>
              <div className="p-3">
                {isEditing ? (
                  <Select
                    value={editForm.epic_id?.toString() || "none"}
                    onValueChange={(value) => setEditForm(prev => ({
                      ...prev,
                      epic_id: value === "none" ? null : parseInt(value)
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select epic..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No epic</SelectItem>
                      {epics.map(epic => (
                        <SelectItem key={epic.id} value={epic.id.toString()}>
                          {epic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {issue.epic ? (
                      <Badge variant="outline" className="text-xs">
                        {issue.epic.title}
                      </Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">No epic</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Milestone */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
              <div className="p-3 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Milestone
                </h3>
              </div>
              <div className="p-3">
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {milestones.map(milestone => {
                      const isSelected = editForm.milestone_id === milestone.id;
                      return (
                        <Badge
                          key={milestone.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`text-xs cursor-pointer hover:opacity-80 ${
                            isSelected ? 'bg-black text-white dark:bg-white dark:text-black' : ''
                          }`}
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            milestone_id: isSelected ? null : milestone.id
                          }))}
                        >
                          {milestone.title}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {issue.milestone ? (
                      <Badge variant="outline" className="text-xs">{issue.milestone.title}</Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">No milestone</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Time Tracking */}
            <Collapsible open={detailsExpanded} onOpenChange={setDetailsExpanded}>
              <div className="bg-background/60 backdrop-blur-sm rounded-lg border">
                <CollapsibleTrigger className="w-full p-3 border-b hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Tracking
                    </h3>
                    {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Estimate (hours)</label>
                      <Input
                        type="number"
                        value={editForm.time_estimate / 3600}
                        onChange={(e) => {
                          const hours = parseFloat(e.target.value) || 0;
                          setEditForm(prev => ({ 
                            ...prev, 
                            time_estimate: hours * 3600 
                          }));
                        }}
                        placeholder="0"
                        min="0"
                        step="0.25"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Time Spent (hours)</label>
                      <Input
                        type="number"
                        value={editForm.time_spent / 3600}
                        onChange={(e) => {
                          const hours = parseFloat(e.target.value) || 0;
                          setEditForm(prev => ({ 
                            ...prev, 
                            time_spent: hours * 3600 
                          }));
                        }}
                        placeholder="0"
                        min="0"
                        step="0.25"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Estimate</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {formatTimeEstimate(issue.time_stats?.time_estimate || 0)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time Spent</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {formatTimeEstimate(issue.time_stats?.total_time_spent || 0)}
                      </Badge>
                    </div>
                  </div>
                )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;
