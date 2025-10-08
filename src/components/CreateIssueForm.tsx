import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Tag, FileText, Clock, Users, FolderOpen, Sparkles, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  GitLabCredentials,
  CreateIssueFormData,
  CreateIssueRequest,
  GitLabIssue,
} from '@/types/gitlab';
import {
  useGitLabGroupProjects,
  useGitLabUsers,
  useCreateGitLabIssue,
} from '@/hooks/useGitLabAPI';
import { SearchableMultiSelect } from '@/components/SearchableMultiSelect';

interface CreateIssueFormProps {
  credentials: GitLabCredentials | null;
  issues?: GitLabIssue[];
  onIssueCreated?: () => void;
}

const createIssueSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title too long'),
  description: z.string().optional(),
  projectId: z.number().positive('Please select a project'),
  timeEstimate: z.number().positive().optional().nullable(),
  assigneeIds: z.array(z.number()).optional(),
  labels: z.array(z.string()).optional(),
});

export function CreateIssueForm({ 
  credentials, 
  issues = [],
  onIssueCreated
}: CreateIssueFormProps) {
  const navigate = useNavigate();
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // API hooks
  const { data: projects = [] } = useGitLabGroupProjects(credentials);
  const { data: users = [] } = useGitLabUsers(credentials);
  const createIssueMutation = useCreateGitLabIssue(credentials);

  // Extract unique labels from existing issues (same approach as GlobalFilterSection)
  const allLabels = useMemo(() => {
    const labels = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => {
        // Labels in GitLabIssue are already strings
        labels.add(label);
      });
    });
    return Array.from(labels).sort();
  }, [issues]);

  // Form setup
  const form = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: null,
      assigneeIds: [],
      labels: [],
      timeEstimate: null,
    },
  });

  // Watch assigneeIds for debugging
  // const assigneeIdsValue = form.watch('assigneeIds');
  // React.useEffect(() => {
  //   console.log('AssigneeIds value changed:', assigneeIdsValue);
  // }, [assigneeIdsValue]);
  
  // React.useEffect(() => {
  //   console.log('Form initialized with default values');
  //   console.log('Form state:', form.getValues());
  // }, []);
  
  // Log form state periodically for debugging
  // React.useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log('Current form state:', form.getValues());
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [form]);

  // Helper function to extract project path from GitLab issue URL
  const getProjectPathFromIssue = (issue: GitLabIssue): string | null => {
    try {
      const url = new URL(issue.web_url);
      const pathParts = url.pathname.split('/');
      const issueIndex = pathParts.findIndex(part => part === 'issues');
      
      if (issueIndex > 0) {
        // Get the project path (everything before /-/issues)
        const projectPath = pathParts.slice(1, issueIndex - 1).join('/');
        return projectPath;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to extract project path from issue URL:', error);
      return null;
    }
  };

  // Transform form data to API request format
  const transformFormData = (formData: CreateIssueFormData): CreateIssueRequest => {
    const request: CreateIssueRequest = {
      projectId: formData.projectId!,
      title: formData.title,
      description: formData.description || '',
      assignee_ids: formData.assigneeIds || [],
    };

    // Add labels if selected
    if (formData.labels && formData.labels.length > 0) {
      request.labels = formData.labels;
    }

    // Add time estimate (convert hours to seconds)
    if (formData.timeEstimate) {
      request.time_estimate = formData.timeEstimate * 3600;
    }

    return request;
  };

  const onSubmit = async (data: CreateIssueFormData) => {
    try {
      const issueRequest = transformFormData(data);
      const createdIssue = await createIssueMutation.mutateAsync(issueRequest);
      
      toast.success('Issue created successfully!', {
        description: `"${data.title}" has been created.`,
      });
      
      // Open the created issue in a new tab
      console.log('Created issue:', createdIssue);
      if (createdIssue?.web_url) {
        console.log('Issue web_url:', createdIssue.web_url);
        const projectPath = getProjectPathFromIssue(createdIssue);
        console.log('Extracted project path:', projectPath);
        if (projectPath) {
          const navigationUrl = `/issue/${encodeURIComponent(projectPath)}/${createdIssue.iid}?from=/`;
          const absoluteUrl = `${window.location.origin}${navigationUrl}`;
          console.log('Opening created issue in new tab:', absoluteUrl);
          // Open in new tab within the app using absolute URL
          window.open(absoluteUrl, '_blank');
        } else {
          console.warn('Could not extract project path from issue URL:', createdIssue.web_url);
        }
      } else {
        console.warn('Created issue does not have web_url:', createdIssue);
      }
      
      // Reset form
      setAssigneeSearch('');
      form.reset({
        title: '',
        description: '',
        projectId: null,
        assigneeIds: [],
        labels: [],
        timeEstimate: null,
      });
      
      // Notify parent that issue was created
      if (onIssueCreated) {
        onIssueCreated();
      }
    } catch (error) {
      console.error('Failed to create issue:', error);
      toast.error('Failed to create issue', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  // Label options (extracted from existing issues like GlobalFilterSection)
  const labelOptions = useMemo(() => {
    if (!allLabels || allLabels.length === 0) {
      return [];
    }
    
    return allLabels.map(label => ({
      value: label,
      label: label,
    }));
  }, [allLabels]);

  // Assignee options (similar to GlobalFilterSection)
  const assigneeOptions = useMemo(() => {
    const options = users.map(user => ({
      value: user.id.toString(),
      label: user.name
    }));
    // console.log('Assignee options:', options);
    return options;
  }, [users]);

  // Project options for the searchable dropdown
  const projectOptions = useMemo(() => {
    return projects.map(project => ({
      value: project.id.toString(),
      label: project.name
    }));
  }, [projects]);

  // Filtered labels based on search
  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) return allLabels;
    return allLabels.filter(label => 
      label.toLowerCase().includes(labelSearch.toLowerCase())
    );
  }, [allLabels, labelSearch]);

  // Watch form values for character counts
  const titleValue = form.watch('title') || '';
  const descriptionValue = form.watch('description') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4 bg-background/60 backdrop-blur-sm rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Create New Issue
              </h1>
              <p className="text-xs text-muted-foreground">Fill in the details to create a new GitLab issue</p>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Action Panel - Moved to Top */}
            <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-3 mb-4">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                
                <div className="flex gap-2">
                  {showClearConfirm ? (
                    <div className="flex items-center gap-2 bg-destructive/10 px-2 py-1 rounded-md">
                      <span className="text-xs text-destructive">Clear all?</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setAssigneeSearch('');
                          setLabelSearch('');
                          form.reset({
                            title: '',
                            description: '',
                            projectId: null,
                            assigneeIds: [],
                            labels: [],
                            timeEstimate: null,
                          });
                          setShowClearConfirm(false);
                        }}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowClearConfirm(false)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createIssueMutation.isPending}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 min-w-[120px]"
                  >
                    {createIssueMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Create Issue
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                {/* Essential Information */}
                <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Essential Info</h2>
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  </div>
                  <div className="space-y-3">
                    {/* Issue Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium">Title *</FormLabel>
                            <span className={`text-xs ${titleValue.length > 255 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {titleValue.length}/255
                            </span>
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Enter issue title..." 
                              className="h-8"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Project Selection */}
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Project *</FormLabel>
                          <FormControl>
                            <SearchableMultiSelect
                              options={projectOptions}
                              selected={field.value ? [field.value.toString()] : []}
                              onChange={(selected) => {
                                if (selected.length > 0) {
                                  field.onChange(parseInt(selected[selected.length - 1]));
                                } else {
                                  field.onChange(null);
                                }
                              }}
                              placeholder="Select project"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Assignment & Time */}
                <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Assignment</h2>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </div>
                  <div className="space-y-3">

                    {/* Time Estimation */}
                    <FormField
                      control={form.control}
                      name="timeEstimate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Time (hours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="0"
                              className="h-8"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value ? parseFloat(value) : null);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Assignee */}
                    <FormField
                      control={form.control}
                      name="assigneeIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Assignees</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {/* Search Input */}
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  placeholder="Search assignees..."
                                  value={assigneeSearch}
                                  onChange={(e) => setAssigneeSearch(e.target.value)}
                                  className="pl-9 h-8"
                                />
                              </div>

                              {/* Selected Assignees Display */}
                              {(field.value || []).length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-xs font-medium text-muted-foreground">Selected:</span>
                                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border">
                                    {(field.value || []).map((assigneeId) => {
                                      const assignee = users.find(user => user.id === assigneeId);
                                      if (!assignee) return null;
                                      
                                      const truncatedName = assignee.name.length > 12 
                                        ? assignee.name.slice(0, -12) 
                                        : assignee.name;
                                      
                                      return (
                                        <Badge key={assigneeId} variant="default" className="text-xs h-8 flex items-center gap-2 pl-1">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={assignee.avatar_url} alt={assignee.name} />
                                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                              {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span>{truncatedName}</span>
                                          <X 
                                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                            onClick={() => {
                                              const current = field.value || [];
                                              field.onChange(current.filter(id => id !== assigneeId));
                                            }}
                                          />
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Available Assignees */}
                              <div>
                                <span className="text-xs font-medium text-muted-foreground mb-2 block">Available Assignees:</span>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background/50">
                                  {users
                                    .filter(user => 
                                      !assigneeSearch.trim() || 
                                      user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
                                    )
                                    .map((user) => {
                                      const isSelected = (field.value || []).includes(user.id);
                                      const truncatedName = user.name.length > 12 
                                        ? user.name.slice(0, -12) 
                                        : user.name;
                                      
                                      return (
                                        <button
                                          key={user.id}
                                          type="button"
                                          onClick={() => {
                                            const current = field.value || [];
                                            if (isSelected) {
                                              field.onChange(current.filter(id => id !== user.id));
                                            } else {
                                              field.onChange([...current, user.id]);
                                            }
                                          }}
                                          className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                            isSelected
                                              ? 'bg-primary text-primary-foreground border-primary'
                                              : 'bg-background text-foreground border-border hover:bg-muted/50'
                                          }`}
                                        >
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={user.avatar_url} alt={user.name} />
                                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span>{truncatedName}</span>
                                        </button>
                                      );
                                    })}
                                  {users.filter(user => 
                                    !assigneeSearch.trim() || 
                                    user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
                                  ).length === 0 && assigneeSearch && (
                                    <div className="w-full text-center py-4">
                                      <span className="text-muted-foreground text-xs">No assignees found matching "{assigneeSearch}"</span>
                                    </div>
                                  )}
                                  {users.length === 0 && (
                                    <div className="w-full text-center py-4">
                                      <span className="text-muted-foreground text-xs">No assignees available</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4">
                {/* Labels */}
                <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Labels</h2>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </div>
                  <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-3">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="Search labels..."
                              value={labelSearch}
                              onChange={(e) => setLabelSearch(e.target.value)}
                              className="pl-9 h-8"
                            />
                          </div>

                          {/* Selected Labels Display */}
                          {(field.value || []).length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground">Selected:</span>
                              <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border">
                                {(field.value || []).map((label) => (
                                  <Badge key={label} variant="default" className="text-xs h-7 flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span>{label}</span>
                                    <X 
                                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                      onClick={() => {
                                        const current = field.value || [];
                                        field.onChange(current.filter(l => l !== label));
                                      }}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Available Labels */}
                          <div>
                            <span className="text-xs font-medium text-muted-foreground mb-2 block">Available Labels:</span>
                            <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background/50">
                              {filteredLabels.map((label) => {
                                const isSelected = (field.value || []).includes(label);
                                return (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                      const current = field.value || [];
                                      if (isSelected) {
                                        field.onChange(current.filter(l => l !== label));
                                      } else {
                                        field.onChange([...current, label]);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                      isSelected
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-border hover:bg-muted/50'
                                    }`}
                                  >
                                    <Tag className="h-3 w-3" />
                                    <span>{label}</span>
                                  </button>
                                );
                              })}
                              {filteredLabels.length === 0 && labelSearch && (
                                <div className="w-full text-center py-4">
                                  <span className="text-muted-foreground text-xs">No labels found matching "{labelSearch}"</span>
                                </div>
                              )}
                              {allLabels.length === 0 && (
                                <div className="w-full text-center py-4">
                                  <span className="text-muted-foreground text-xs">No labels available from existing issues</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description Section */}
                <div className="bg-background/60 backdrop-blur-sm rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">Description</h2>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel className="text-xs font-medium">Description</FormLabel>
                          <span className="text-xs text-muted-foreground">
                            {descriptionValue.length} chars
                          </span>
                        </div>
                        <FormControl>
                          <MarkdownEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Describe the issue in detail..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}