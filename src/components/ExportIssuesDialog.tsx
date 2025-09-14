import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GitLabIssue } from '@/types/gitlab';

export type ExportColumnKey =
  | 'iid'
  | 'title'
  | 'state'
  | 'resolved_status'
  | 'assignees'
  | 'author'
  | 'labels'
  | 'iteration'
  | 'iteration_start'
  | 'iteration_due'
  | 'created_at'
  | 'updated_at'
  | 'estimate_hours'
  | 'spent_hours'
  | 'remaining_hours'
  | 'epic'
  | 'parent'
  | 'web_url';

const ALL_COLUMNS: { key: ExportColumnKey; label: string }[] = [
  { key: 'iid', label: 'Issue IID' },
  { key: 'title', label: 'Title' },
  { key: 'state', label: 'State' },
  { key: 'resolved_status', label: 'Resolved Status' },
  { key: 'assignees', label: 'Assignees' },
  { key: 'author', label: 'Author' },
  { key: 'labels', label: 'Labels' },
  { key: 'iteration', label: 'Iteration' },
  { key: 'iteration_start', label: 'Iteration Start' },
  { key: 'iteration_due', label: 'Iteration Due' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
  { key: 'estimate_hours', label: 'Estimate (h)' },
  { key: 'spent_hours', label: 'Spent (h)' },
  { key: 'remaining_hours', label: 'Remaining (h)' },
  { key: 'epic', label: 'Epic' },
  { key: 'parent', label: 'Parent' },
  { key: 'web_url', label: 'URL' },
];

const DEFAULT_COLUMNS: ExportColumnKey[] = [
  'iid',
  'title',
  'resolved_status',
  'assignees',
  'labels',
  'iteration',
  'estimate_hours',
  'spent_hours',
  'remaining_hours',
  'web_url',
];

function toCSVValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildRow(issue: GitLabIssue, column: ExportColumnKey): string | number {
  const timeStats = issue.time_stats || { time_estimate: 0, total_time_spent: 0 };
  const estimateH = (timeStats.time_estimate || 0) / 3600;
  const spentH = (timeStats.total_time_spent || 0) / 3600;
  const remainingH = Math.max(0, (timeStats.time_estimate || 0) - (timeStats.total_time_spent || 0)) / 3600;

  switch (column) {
    case 'iid': return issue.iid;
    case 'title': return issue.title || '';
    case 'state': return issue.state || '';
    case 'resolved_status': return issue.resolved_status?.name || '';
    case 'assignees': return issue.assignees?.map(a => a.name || a.username).join(', ') || '';
    case 'author': return issue.author?.name || issue.author?.username || '';
    case 'labels': return issue.labels?.join(', ') || '';
    case 'iteration': return issue.iteration?.title || '';
    case 'iteration_start': return issue.iteration?.start_date || '';
    case 'iteration_due': return issue.iteration?.due_date || '';
    case 'created_at': return issue.created_at || '';
    case 'updated_at': return issue.updated_at || '';
    case 'estimate_hours': return estimateH.toFixed(2);
    case 'spent_hours': return spentH.toFixed(2);
    case 'remaining_hours': return remainingH.toFixed(2);
    case 'epic': return issue.epic?.title || '';
    case 'parent': return issue.parent?.title || '';
    case 'web_url': return issue.web_url || '';
    default: return '';
  }
}

function issuesToCSV(issues: GitLabIssue[], columns: ExportColumnKey[], suggestedFilename?: string) {
  const header = columns.map(c => toCSVValue(ALL_COLUMNS.find(ac => ac.key === c)?.label || c)).join(',');
  const lines = issues.map(issue => {
    const values = columns.map(c => toCSVValue(buildRow(issue, c)));
    return values.join(',');
  });
  const csv = [header, ...lines].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedFilename || 'issues.csv';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportIssuesDialog({
  open,
  onOpenChange,
  issues,
  defaultColumns,
  iterationName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  issues: GitLabIssue[];
  defaultColumns?: ExportColumnKey[];
  iterationName?: string | null;
}) {
  const initial = defaultColumns && defaultColumns.length ? defaultColumns : DEFAULT_COLUMNS;
  const [selected, setSelected] = useState<ExportColumnKey[]>(initial);

  const allChecked = selected.length === ALL_COLUMNS.length;
  const someChecked = selected.length > 0 && !allChecked;

  const resolvedIterationName = useMemo(() => {
    if (iterationName) return iterationName;
    const counts = new Map<string, number>();
    for (const issue of issues) {
      const t = issue.iteration?.title;
      if (t) counts.set(t, (counts.get(t) || 0) + 1);
    }
    let maxK: string | null = null;
    let maxV = 0;
    counts.forEach((v, k) => { if (v > maxV) { maxV = v; maxK = k; } });
    return maxK || null;
  }, [issues, iterationName]);

  const filename = useMemo(() => {
    const base = resolvedIterationName ? `iteration-${resolvedIterationName}` : 'issues';
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${base}-${y}${m}${d}.csv`;
  }, [resolvedIterationName]);

  const toggleAll = () => {
    setSelected(allChecked ? [] : ALL_COLUMNS.map(c => c.key));
  };

  const onConfirm = () => {
    if (!selected.length) return;
    issuesToCSV(issues, selected, filename);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export issues to CSV</DialogTitle>
          <DialogDescription>
            Select the columns you want to include in the CSV export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[50vh] overflow-auto pr-1">
          <div className="flex items-center gap-2">
            <Checkbox id="select-all" checked={allChecked} onCheckedChange={toggleAll} />
            <Label htmlFor="select-all">Select all</Label>
            {someChecked && <span className="text-xs text-muted-foreground">{selected.length} selected</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ALL_COLUMNS.map(({ key, label }) => {
              const id = `col-${key}`;
              const checked = selected.includes(key);
              return (
                <div key={key} className="flex items-center space-x-2 border rounded-md p-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(v) => {
                      const isChecked = Boolean(v);
                      setSelected(prev => isChecked ? Array.from(new Set([...prev, key])) : prev.filter(k => k !== key));
                    }}
                  />
                  <Label htmlFor={id} className="text-sm">{label}</Label>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <div className="flex-1 text-sm text-muted-foreground">Filename: {filename}</div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Export CSV</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
