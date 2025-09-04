import React, { useState, useMemo } from 'react';
import { Search, Tag } from 'lucide-react';
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
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');

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
      
      // Automatically open the created issue in a new tab
      if (createdIssue?.web_url) {
        window.open(createdIssue.web_url, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Issue</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Two columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* First Column */}
            <div className="space-y-6">
              {/* 1. Issue Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter issue title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2. Estimation */}
              <FormField
                control={form.control}
                name="timeEstimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimation (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
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

              {/* 3. Project */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project *</FormLabel>
                    <FormControl>
                      <SearchableMultiSelect
                        options={projectOptions}
                        selected={field.value ? [field.value.toString()] : []}
                        onChange={(selected) => {
                          // Ensure only one project can be selected (single select behavior)
                          if (selected.length > 0) {
                            field.onChange(parseInt(selected[selected.length - 1]));
                          } else {
                            field.onChange(null);
                          }
                        }}
                        placeholder="Select a project"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 4. Assignee */}
              <FormField
                control={form.control}
                name="assigneeIds"
                render={({ field }) => {
                  // console.log('Assignee field object:', field);
                  return (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <FormControl>
                        <div className="flex-1 min-w-[150px] relative">
                          <SearchableMultiSelect
                            options={assigneeOptions}
                            selected={(field.value || []).map(id => id.toString())}
                            onChange={(selected) => {
                              // console.log('Assignee selected:', selected);
                              // console.log('Field value before onChange:', field.value);
                              const parsed = selected.map(id => parseInt(id));
                              // console.log('Parsed assignee IDs:', parsed);
                              field.onChange(parsed);
                              // console.log('Field value after onChange:', parsed);
                            }}
                            placeholder="Select assignees..."
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Second Column */}
            <div className="space-y-6">
              {/* 5. Labels */}
              <FormField
                control={form.control}
                name="labels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labels</FormLabel>
                    <FormControl>
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
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[2.5rem] max-h-40 overflow-y-auto custom-scrollbar">
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
                    </FormControl>
                    <FormDescription>
                      {allLabels.length === 0 
                        ? "No labels found in existing issues. Labels will be available after creating issues with labels."
                        : `${allLabels.length} labels available from existing issues.`
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 6. Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Describe the issue in detail..."
                      />
                    </FormControl>
                    <FormDescription>
                      You can use Markdown formatting. Supports headings, bold, italic, links, code, and lists.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssigneeSearch('');
                form.reset({
                  title: '',
                  description: '',
                  projectId: null,
                  assigneeIds: [],
                  labels: [],
                  timeEstimate: null,
                });
              }}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={createIssueMutation.isPending}
            >
              {createIssueMutation.isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}