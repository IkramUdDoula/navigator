import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';
import { SprintAnalytics } from './SprintAnalytics';
import { GitLabIssue, GitLabCredentials, BoardConfig, BoardListConfig } from '@/types/gitlab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGitLabUsers } from '@/hooks/useGitLabAPI';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ExportIssuesDialog } from '@/components/ExportIssuesDialog';
import { BoardConfigDialog } from './BoardConfigDialog';
import { Settings2, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CustomizableKanbanBoardProps {
  issues: GitLabIssue[];
  onIssueClick?: (issue: GitLabIssue) => void;
  className?: string;
}

interface BoardColumn {
  id: string;
  name: string;
  issues: GitLabIssue[];
  filterType: string;
  filterValue: string;
}

// Default board configuration
const DEFAULT_BOARD: BoardConfig = {
  id: 'default-board',
  name: 'Default Board',
  lists: [
    { id: 'todo', name: 'To Do', filterType: 'status', filterValue: 'To Do', position: 0 },
    { id: 'doing', name: 'Doing', filterType: 'status', filterValue: 'Doing', position: 1 },
    { id: 'review', name: 'Review', filterType: 'status', filterValue: 'Review', position: 2 },
    { id: 'testing', name: 'Testing', filterType: 'status', filterValue: 'Testing', position: 3 },
    { id: 'done', name: 'Done', filterType: 'status', filterValue: 'Done', position: 4 },
    { id: 'closed', name: 'Closed', filterType: 'state', filterValue: 'closed', position: 5 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function CustomizableKanbanBoard({ 
  issues, 
  onIssueClick, 
  className 
}: CustomizableKanbanBoardProps) {
  
  // Get credentials for basic functionality
  const [credentials] = useLocalStorage<GitLabCredentials | null>('gitlab-credentials', null);
  const [exportOpen, setExportOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  
  // Store boards and active board
  const [boards, setBoards] = useLocalStorage<BoardConfig[]>('kanban-boards', [DEFAULT_BOARD]);
  const [activeBoardId, setActiveBoardId] = useLocalStorage<string>('active-board-id', 'default-board');
  
  // Fetch users for sprint analytics
  const { data: users = [] } = useGitLabUsers(credentials);
  
  // Get active board
  const activeBoard = useMemo(() => {
    return boards.find(b => b.id === activeBoardId) || boards[0] || DEFAULT_BOARD;
  }, [boards, activeBoardId]);

  // Filter issues based on board list configuration
  const filterIssuesForList = (list: BoardListConfig): GitLabIssue[] => {
    return issues.filter(issue => {
      switch (list.filterType) {
        case 'status':
          if (list.filterValue === 'Closed') {
            return issue.state === 'closed';
          }
          return issue.resolved_status?.name === list.filterValue;
        
        case 'label':
          return issue.labels.includes(list.filterValue);
        
        case 'assignee':
          return issue.assignees.some(assignee => assignee.username === list.filterValue);
        
        case 'state':
          return issue.state === list.filterValue;
        
        default:
          return false;
      }
    });
  };

  // Create board columns from active board configuration
  const boardColumns = useMemo((): BoardColumn[] => {
    return activeBoard.lists
      .sort((a, b) => a.position - b.position)
      .map(list => ({
        id: list.id,
        name: list.name,
        issues: filterIssuesForList(list),
        filterType: list.filterType,
        filterValue: list.filterValue,
      }));
  }, [activeBoard, issues]);

  const totalIssues = boardColumns.reduce((sum, col) => sum + col.issues.length, 0);

  // Determine current iteration name from provided issues (most represented)
  const currentIterationName = useMemo(() => {
    const counts = new Map<string, number>();
    issues.forEach(issue => {
      const t = issue.iteration?.title;
      if (t) counts.set(t, (counts.get(t) || 0) + 1);
    });
    let maxK: string | null = null;
    let maxV = 0;
    counts.forEach((v, k) => { if (v > maxV) { maxV = v; maxK = k; } });
    return maxK;
  }, [issues]);

  // Only include issues from the current iteration for export
  const iterationIssues = useMemo(() => {
    if (!currentIterationName) return issues;
    return issues.filter(i => i.iteration?.title === currentIterationName);
  }, [issues, currentIterationName]);

  const handleSaveBoard = (board: BoardConfig) => {
    const existingIndex = boards.findIndex(b => b.id === board.id);
    if (existingIndex >= 0) {
      // Update existing board
      const newBoards = [...boards];
      newBoards[existingIndex] = board;
      setBoards(newBoards);
    } else {
      // Add new board
      setBoards([...boards, board]);
      setActiveBoardId(board.id);
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) {
      alert('Cannot delete the last board');
      return;
    }
    const newBoards = boards.filter(b => b.id !== boardId);
    setBoards(newBoards);
    if (activeBoardId === boardId) {
      setActiveBoardId(newBoards[0].id);
    }
  };

  const handleNewBoard = () => {
    setConfigOpen(true);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Sprint Analytics - Above Kanban Board */}
      <SprintAnalytics 
        issues={issues}
        users={users}
        className="bg-muted/30 rounded-lg"
      />

      {/* Board Controls */}
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {currentIterationName ? (
              <span>
                Iteration: <span className="font-medium">{currentIterationName}</span> · {totalIssues} issues
              </span>
            ) : (
              <span>{totalIssues} issues</span>
            )}
          </div>
          
          {/* Board Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                {activeBoard.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Boards</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {boards.map(board => (
                <DropdownMenuItem
                  key={board.id}
                  onClick={() => setActiveBoardId(board.id)}
                  className="flex items-center justify-between"
                >
                  <span>{board.name}</span>
                  {board.id === activeBoardId && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNewBoard}>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfigOpen(true)}>
                <Settings2 className="h-4 w-4 mr-2" />
                Edit Current Board
              </DropdownMenuItem>
              {boards.length > 1 && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteBoard(activeBoardId)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Current Board
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button onClick={() => setExportOpen(true)}>Export CSV</Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Kanban Board */}
        <div className="flex gap-4 min-h-[500px] w-full overflow-x-auto">
          {boardColumns.map((column) => (
            <Card key={column.id} className="flex flex-col flex-shrink-0 w-80">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{column.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {column.issues.length}
                  </Badge>
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  {column.filterType}: {column.filterValue}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div className="space-y-3">
                  {column.issues.map((issue) => (
                    <KanbanCard
                      key={issue.id}
                      issue={issue}
                      onClick={onIssueClick}
                    />
                  ))}
                  {column.issues.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No issues
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {boardColumns.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No lists configured
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure your board to start organizing issues.
            </p>
            <Button onClick={() => setConfigOpen(true)}>
              <Settings2 className="h-4 w-4 mr-2" />
              Configure Board
            </Button>
          </div>
        )}
      </div>

      {/* Board Configuration Dialog */}
      <BoardConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        currentBoard={activeBoard}
        onSave={handleSaveBoard}
        issues={issues}
        users={users}
      />

      {/* Export Dialog */}
      <ExportIssuesDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        issues={iterationIssues}
        iterationName={currentIterationName || null}
      />
    </div>
  );
}
