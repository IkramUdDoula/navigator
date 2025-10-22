import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { BoardConfig, BoardListConfig, BoardListFilterType, GitLabIssue, GitLabUser } from '@/types/gitlab';
import { Badge } from '@/components/ui/badge';

interface BoardConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBoard: BoardConfig | null;
  onSave: (board: BoardConfig) => void;
  issues: GitLabIssue[];
  users: GitLabUser[];
}

export function BoardConfigDialog({
  open,
  onOpenChange,
  currentBoard,
  onSave,
  issues,
  users,
}: BoardConfigDialogProps) {
  const [boardName, setBoardName] = useState(currentBoard?.name || 'New Board');
  const [lists, setLists] = useState<BoardListConfig[]>(
    currentBoard?.lists || []
  );

  // Extract unique values for filter options
  const statuses = React.useMemo(() => {
    const statusSet = new Set<string>();
    issues.forEach(issue => {
      if (issue.resolved_status) {
        statusSet.add(issue.resolved_status.name);
      }
      if (issue.state === 'closed') {
        statusSet.add('Closed');
      }
    });
    return Array.from(statusSet).sort();
  }, [issues]);

  const labels = React.useMemo(() => {
    const labelSet = new Set<string>();
    issues.forEach(issue => {
      issue.labels.forEach(label => labelSet.add(label));
    });
    return Array.from(labelSet).sort();
  }, [issues]);

  const assignees = React.useMemo(() => {
    return users.map(user => user.username).sort();
  }, [users]);

  const handleAddList = () => {
    const newList: BoardListConfig = {
      id: `list-${Date.now()}`,
      name: 'New List',
      filterType: 'status',
      filterValue: '',
      position: lists.length,
    };
    setLists([...lists, newList]);
  };

  const handleRemoveList = (listId: string) => {
    setLists(lists.filter(list => list.id !== listId));
  };

  const handleUpdateList = (listId: string, updates: Partial<BoardListConfig>) => {
    setLists(lists.map(list => 
      list.id === listId ? { ...list, ...updates } : list
    ));
  };

  const handleSave = () => {
    const board: BoardConfig = {
      id: currentBoard?.id || `board-${Date.now()}`,
      name: boardName,
      lists: lists.map((list, index) => ({ ...list, position: index })),
      createdAt: currentBoard?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(board);
    onOpenChange(false);
  };

  const getFilterOptions = (filterType: BoardListFilterType): string[] => {
    switch (filterType) {
      case 'status':
        return statuses;
      case 'label':
        return labels;
      case 'assignee':
        return assignees;
      case 'state':
        return ['opened', 'closed'];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Kanban Board</DialogTitle>
          <DialogDescription>
            Create custom lists based on status, labels, assignees, or state. Drag to reorder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Board Name */}
          <div className="space-y-2">
            <Label htmlFor="board-name">Board Name</Label>
            <Input
              id="board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Enter board name"
            />
          </div>

          {/* Lists Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lists</Label>
              <Button onClick={handleAddList} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add List
              </Button>
            </div>

            {lists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No lists configured. Click "Add List" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {lists.map((list, index) => (
                  <div
                    key={list.id}
                    className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                    
                    <div className="flex-1 space-y-3">
                      {/* List Name */}
                      <div className="space-y-1">
                        <Label htmlFor={`list-name-${list.id}`} className="text-xs">
                          List Name
                        </Label>
                        <Input
                          id={`list-name-${list.id}`}
                          value={list.name}
                          onChange={(e) =>
                            handleUpdateList(list.id, { name: e.target.value })
                          }
                          placeholder="Enter list name"
                        />
                      </div>

                      {/* Filter Type and Value */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`filter-type-${list.id}`} className="text-xs">
                            Filter By
                          </Label>
                          <Select
                            value={list.filterType}
                            onValueChange={(value: BoardListFilterType) =>
                              handleUpdateList(list.id, { filterType: value, filterValue: '' })
                            }
                          >
                            <SelectTrigger id={`filter-type-${list.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="status">Status</SelectItem>
                              <SelectItem value="label">Label</SelectItem>
                              <SelectItem value="assignee">Assignee</SelectItem>
                              <SelectItem value="state">State</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`filter-value-${list.id}`} className="text-xs">
                            Value
                          </Label>
                          <Select
                            value={list.filterValue}
                            onValueChange={(value) =>
                              handleUpdateList(list.id, { filterValue: value })
                            }
                          >
                            <SelectTrigger id={`filter-value-${list.id}`}>
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFilterOptions(list.filterType).map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Preview */}
                      {list.filterValue && (
                        <div className="text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {list.filterType}: {list.filterValue}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveList(list.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={lists.length === 0 || !boardName}>
            Save Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
