'use client';

import { useState, useTransition } from 'react';
import {
  updateTaskDoDAndMeta,
  updateTaskStatus,
  deleteTask,
} from '@/lib/actions/tasks';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  Lock,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DoDItem,
  PriorityLevel,
  Profile,
  RoadmapWeek,
  Task,
  TaskStatus,
} from '@/types/database';

interface KanbanBoardProps {
  initialTasks: Task[];
  teammates: Profile[];
  weeks: Pick<RoadmapWeek, 'id' | 'week_number' | 'title'>[];
  currentUserId: string;
}

const COLUMNS: { id: TaskStatus; title: string; accent: string }[] = [
  { id: 'backlog', title: 'BACKLOG', accent: 'border-zinc-700 text-zinc-400' },
  {
    id: 'in_progress',
    title: 'IN PROGRESS',
    accent: 'border-sky-500/40 text-sky-400',
  },
  {
    id: 'review',
    title: 'PEER REVIEW',
    accent: 'border-amber-500/40 text-amber-400',
  },
  {
    id: 'done',
    title: 'DONE (VERIFIED)',
    accent: 'border-emerald-500/40 text-emerald-400',
  },
];

const PRIORITY_STYLES: Record<PriorityLevel, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  low: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export function KanbanBoard({
  initialTasks,
  teammates,
  weeks,
  currentUserId,
}: KanbanBoardProps) {
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dodDraft, setDodDraft] = useState<DoDItem[]>([]);
  const [prUrlDraft, setPrUrlDraft] = useState<string>('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Open task modal and initialize local DoD state
  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setDodDraft(
      Array.isArray(task.definition_of_done) ? task.definition_of_done : []
    );
    setPrUrlDraft(task.github_pr_url ?? '');
    setGateError(null);
  };

  // Filter tasks by owner and roadmap week
  const filteredTasks = initialTasks.filter((t) => {
    const matchesOwner =
      ownerFilter === 'all'
        ? true
        : ownerFilter === 'shared'
        ? t.owner_id === null
        : t.owner_id === ownerFilter;

    const matchesWeek =
      weekFilter === 'all' ? true : t.week_id === weekFilter;

    return matchesOwner && matchesWeek;
  });

  const getOwnerLabel = (ownerId: string | null) => {
    if (!ownerId) return 'Shared';
    return (
      teammates.find((m) => m.id === ownerId)?.display_name ?? 'Member'
    );
  };

  const getWeekNumber = (weekId: string | null) => {
    if (!weekId) return null;
    return weeks.find((w) => w.id === weekId)?.week_number ?? null;
  };

  // Toggle a single DoD item inside the open modal and persist immediately
  const handleToggleDodItem = (itemId: string) => {
    if (!selectedTask) return;
    setGateError(null);

    const updated = dodDraft.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setDodDraft(updated);

    startTransition(async () => {
      await updateTaskDoDAndMeta(selectedTask.id, updated, prUrlDraft);
    });
  };

  const handleSavePrUrl = () => {
    if (!selectedTask) return;
    startTransition(async () => {
      await updateTaskDoDAndMeta(selectedTask.id, dodDraft, prUrlDraft);
    });
  };

  const handleStatusChange = (task: Task, nextStatus: TaskStatus) => {
    setGateError(null);
    const dod = Array.isArray(task.definition_of_done)
      ? task.definition_of_done
      : [];
    const allChecked = dod.every((d) => d.checked);

    // If user tries to move to Done from card or modal before DoD is complete, open modal & show gate warning
    if (nextStatus === 'done' && !allChecked) {
      openTaskModal(task);
      setGateError(
        'Cannot mark task Done yet: Complete and check off all Definition of Done items below first.'
      );
      return;
    }

    startTransition(async () => {
      const res = await updateTaskStatus(task.id, nextStatus);
      if (res?.error) {
        setGateError(res.error);
      } else if (selectedTask?.id === task.id) {
        setSelectedTask({ ...selectedTask, status: nextStatus });
      }
    });
  };

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      await deleteTask(taskId);
      setSelectedTask(null);
    });
  };

  const allModalDodChecked =
    dodDraft.length > 0 && dodDraft.every((d) => d.checked);

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
        {/* Owner Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase text-zinc-500 mr-1">
            Owner:
          </span>
          <Button
            variant={ownerFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOwnerFilter('all')}
            className={cn(
              'h-7 text-xs cursor-pointer',
              ownerFilter === 'all'
                ? 'bg-emerald-600 text-zinc-950 font-semibold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            )}
          >
            All ({initialTasks.length})
          </Button>
          {teammates.map((m) => (
            <Button
              key={m.id}
              variant={ownerFilter === m.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOwnerFilter(m.id)}
              className={cn(
                'h-7 text-xs cursor-pointer',
                ownerFilter === m.id
                  ? 'bg-emerald-600 text-zinc-950 font-semibold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              )}
            >
              {m.display_name}
              {m.id === currentUserId ? ' (You)' : ''}
            </Button>
          ))}
          <Button
            variant={ownerFilter === 'shared' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOwnerFilter('shared')}
            className={cn(
              'h-7 text-xs cursor-pointer',
              ownerFilter === 'shared'
                ? 'bg-emerald-600 text-zinc-950 font-semibold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            )}
          >
            Shared
          </Button>
        </div>

        {/* Roadmap Week Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-zinc-500">
            Week:
          </span>
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="h-7 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All 12 Weeks</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.week_number}: {w.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="rounded-xl bg-zinc-900/50 border border-zinc-800/80 p-3 space-y-3 min-h-[460px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-zinc-800/80">
                <span
                  className={cn(
                    'text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded border bg-zinc-950',
                    col.accent
                  )}
                >
                  {col.title}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-2.5 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 rounded-lg border border-dashed border-zinc-800/70 flex items-center justify-center text-[11px] font-mono text-zinc-600">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const dod = Array.isArray(task.definition_of_done)
                      ? task.definition_of_done
                      : [];
                    const checkedCount = dod.filter((d) => d.checked).length;
                    const dodPct =
                      dod.length > 0
                        ? Math.round((checkedCount / dod.length) * 100)
                        : 100;
                    const weekNum = getWeekNumber(task.week_id);
                    const isOverdue =
                      task.due_date &&
                      task.status !== 'done' &&
                      new Date(task.due_date) < new Date(new Date().toDateString());

                    return (
                      <div
                        key={task.id}
                        onClick={() => openTaskModal(task)}
                        className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-600 transition-all cursor-pointer space-y-3 shadow-sm group"
                      >
                        {/* Top Metadata Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-mono uppercase px-1.5 py-0',
                                PRIORITY_STYLES[task.priority]
                              )}
                            >
                              {task.priority}
                            </Badge>
                            {weekNum && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                W{weekNum}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 flex items-center gap-1">
                            <User className="h-2.5 w-2.5 text-emerald-400" />
                            {getOwnerLabel(task.owner_id)}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors leading-snug">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Definition of Done Mini Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-zinc-400 flex items-center gap-1">
                              <ShieldCheck
                                className={cn(
                                  'h-3 w-3',
                                  checkedCount === dod.length
                                    ? 'text-emerald-400'
                                    : 'text-zinc-500'
                                )}
                              />
                              DoD: {checkedCount}/{dod.length}
                            </span>
                            <span
                              className={
                                checkedCount === dod.length
                                  ? 'text-emerald-400'
                                  : 'text-zinc-500'
                              }
                            >
                              {dodPct}%
                            </span>
                          </div>
                          <Progress value={dodPct} className="h-1 bg-zinc-900" />
                        </div>

                        {/* Footer: Due Date, PR Link & Quick Status Select */}
                        <div
                          className="flex items-center justify-between pt-1 border-t border-zinc-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            {task.due_date && (
                              <span
                                className={cn(
                                  'text-[10px] font-mono flex items-center gap-1',
                                  isOverdue ? 'text-red-400 font-semibold' : 'text-zinc-500'
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {task.due_date}
                              </span>
                            )}
                            {task.github_pr_url && (
                              <a
                                href={task.github_pr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono text-sky-400 hover:underline flex items-center gap-0.5"
                              >
                                <GitPullRequest className="h-3 w-3" />
                                PR
                              </a>
                            )}
                          </div>

                          <select
                            value={task.status}
                            disabled={isPending}
                            onChange={(e) =>
                              handleStatusChange(
                                task,
                                e.target.value as TaskStatus
                              )
                            }
                            className="h-6 rounded bg-zinc-900 border border-zinc-800 px-1.5 text-[10px] font-mono text-zinc-300 cursor-pointer"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">
                              {checkedCount === dod.length
                                ? 'Done ✓'
                                : '🔒 Done (DoD)'}
                            </option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Inspection & Definition of Done Enforcement Modal */}
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        {selectedTask && (
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 pr-6">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-mono uppercase',
                    PRIORITY_STYLES[selectedTask.priority]
                  )}
                >
                  {selectedTask.priority} PRIORITY
                </Badge>
                <span className="text-xs font-mono text-zinc-400">
                  Owner: {getOwnerLabel(selectedTask.owner_id)}
                </span>
              </div>
              <DialogTitle className="text-base font-bold text-zinc-100 pt-1">
                {selectedTask.title}
              </DialogTitle>
              {selectedTask.description && (
                <DialogDescription className="text-xs text-zinc-300 leading-relaxed">
                  {selectedTask.description}
                </DialogDescription>
              )}
            </DialogHeader>

            {gateError && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{gateError}</span>
              </div>
            )}

            {/* Definition of Done Checklist Box */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Definition of Done Checklist
                </Label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {dodDraft.filter((d) => d.checked).length} / {dodDraft.length}{' '}
                  Verified
                </span>
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                {dodDraft.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDodItem(item.id)}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded border transition-colors cursor-pointer',
                      item.checked
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-200'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                    )}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => handleToggleDodItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="data-checked:bg-emerald-500 data-checked:border-emerald-500 data-checked:text-zinc-950"
                    />
                    <span
                      className={cn(
                        'text-xs',
                        item.checked && 'line-through text-zinc-400'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Pull Request / Issue Link */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                <GitPullRequest className="h-3.5 w-3.5 text-sky-400" />
                GitHub Pull Request or Commit URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={prUrlDraft}
                  onChange={(e) => setPrUrlDraft(e.target.value)}
                  placeholder="https://github.com/your-org/repo/pull/12"
                  className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSavePrUrl}
                  disabled={isPending}
                  className="h-8 text-xs bg-zinc-800 border-zinc-700 cursor-pointer"
                >
                  Save Link
                </Button>
                {selectedTask.github_pr_url && (
                  <a
                    href={selectedTask.github_pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'h-8 px-2.5 bg-zinc-950 border-zinc-800'
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer: Stage Controls & Delete */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(selectedTask.id)}
                disabled={isPending}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 cursor-pointer"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                {(['backlog', 'in_progress', 'review'] as TaskStatus[]).map(
                  (st) => (
                    <Button
                      key={st}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || selectedTask.status === st}
                      onClick={() => handleStatusChange(selectedTask, st)}
                      className="h-8 text-xs font-mono uppercase bg-zinc-950 border-zinc-800 cursor-pointer"
                    >
                      {st.replace('_', ' ')}
                    </Button>
                  )
                )}

                <Button
                  type="button"
                  size="sm"
                  disabled={!allModalDodChecked || isPending}
                  onClick={() => handleStatusChange(selectedTask, 'done')}
                  className={cn(
                    'h-8 text-xs font-semibold gap-1.5 cursor-pointer',
                    allModalDodChecked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  )}
                >
                  {allModalDodChecked ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Done
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Complete DoD First
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
