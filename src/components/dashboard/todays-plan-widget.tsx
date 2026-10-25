'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  quickMarkResourceStatus,
  quickUpdateTaskFromDashboard,
} from '@/lib/actions/dashboard';
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
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DoDItem, PriorityLevel, Task } from '@/types/database';

export interface DashboardResourceItem {
  id: string;
  title: string;
  url: string;
  category: string;
  priority: PriorityLevel;
  why_studying: string;
  myStatus: 'not_started' | 'in_progress' | 'reviewed';
}

interface TodaysPlanWidgetProps {
  myActiveTasks: Task[];
  weekResources: DashboardResourceItem[];
  activeWeek: number;
  todayIso: string;
}

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  low: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export function TodaysPlanWidget({
  myActiveTasks,
  weekResources,
  activeWeek,
  todayIso,
}: TodaysPlanWidgetProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dodDraft, setDodDraft] = useState<DoDItem[]>([]);
  const [prUrlDraft, setPrUrlDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openQuickCompleteModal = (task: Task) => {
    setSelectedTask(task);
    setDodDraft(
      Array.isArray(task.definition_of_done) ? task.definition_of_done : []
    );
    setPrUrlDraft(task.github_pr_url ?? '');
    setErrorMsg(null);
  };

  const handleToggleDod = (itemId: string) => {
    if (!selectedTask) return;
    setErrorMsg(null);
    const nextDod = dodDraft.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setDodDraft(nextDod);

    startTransition(async () => {
      await quickUpdateTaskFromDashboard(
        selectedTask.id,
        nextDod,
        prUrlDraft,
        false
      );
    });
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await quickUpdateTaskFromDashboard(
        selectedTask.id,
        dodDraft,
        prUrlDraft,
        true
      );
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSelectedTask(null);
      }
    });
  };

  const handleMarkResourceReviewed = (resourceId: string) => {
    startTransition(async () => {
      await quickMarkResourceStatus(resourceId, 'reviewed');
    });
  };

  const allDodChecked =
    dodDraft.length > 0 && dodDraft.every((item) => item.checked);

  return (
    <div className="space-y-5">
      {/* Section 1: Engineering Tasks Queue */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Assigned Engineering Tasks ({myActiveTasks.length})
          </span>
          <Link
            href="/projects"
            className="text-[11px] font-mono text-emerald-400 hover:underline"
          >
            Full Kanban →
          </Link>
        </div>

        {myActiveTasks.length === 0 ? (
          <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                All your Week {activeWeek} engineering tasks are complete!
              </span>
            </div>
            <Link
              href={`/roadmap/${activeWeek}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-7 text-xs bg-zinc-900 border-zinc-800 cursor-pointer'
              )}
            >
              Pull Next Task
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {myActiveTasks.map((task) => {
              const dod = Array.isArray(task.definition_of_done)
                ? task.definition_of_done
                : [];
              const checkedCount = dod.filter((d) => d.checked).length;
              const dodPct =
                dod.length > 0
                  ? Math.round((checkedCount / dod.length) * 100)
                  : 100;
              const isOverdue =
                task.due_date !== null && task.due_date < todayIso;

              return (
                <div
                  key={task.id}
                  onClick={() => openQuickCompleteModal(task)}
                  className={cn(
                    'p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group',
                    isOverdue
                      ? 'bg-red-950/15 border-red-500/40 hover:border-red-400/70'
                      : 'bg-zinc-950/85 border-zinc-800/90 hover:border-zinc-700'
                  )}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-mono uppercase px-1.5 py-0',
                          PRIORITY_COLORS[task.priority]
                        )}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                        {task.status.replace('_', ' ')}
                      </span>
                      {!task.owner_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          SHARED
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-[10px] font-mono font-bold text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          OVERDUE ({task.due_date})
                        </span>
                      )}
                      {!isOverdue && task.due_date && (
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due {task.due_date}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                      {task.title}
                    </p>
                  </div>

                  {/* Right Side: DoD Progress & Quick Verify Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 space-y-1 hidden sm:block">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>DoD</span>
                        <span>
                          {checkedCount}/{dod.length}
                        </span>
                      </div>
                      <Progress value={dodPct} className="h-1 bg-zinc-900" />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuickCompleteModal(task);
                      }}
                      className={cn(
                        'h-7 text-xs font-mono gap-1.5 cursor-pointer',
                        checkedCount === dod.length
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                      )}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      {checkedCount === dod.length ? 'Finish ✓' : 'Verify DoD'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Week Study Queue */}
      <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Week {activeWeek} Study Queue ({weekResources.length} Pending)
          </span>
          <Link
            href="/resources"
            className="text-[11px] font-mono text-emerald-400 hover:underline"
          >
            Resource Library →
          </Link>
        </div>

        {weekResources.length === 0 ? (
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/70 text-xs text-zinc-400 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>You have reviewed all study resources for Week {activeWeek}!</span>
          </div>
        ) : (
          <div className="space-y-2">
            {weekResources.map((res) => (
              <div
                key={res.id}
                className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-zinc-100 hover:text-emerald-400 inline-flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{res.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500" />
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 pl-5">
                    <span className="text-emerald-400 font-mono">Why: </span>
                    {res.why_studying}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleMarkResourceReviewed(res.id)}
                  className="h-7 text-xs font-mono bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-300 shrink-0 gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Mark Reviewed
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline Definition of Done Completion Modal */}
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        {selectedTask && (
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-zinc-100">
                {selectedTask.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Verify all Definition of Done criteria before marking this task complete.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              {dodDraft.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleDod(item.id)}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors',
                    item.checked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  )}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggleDod(item.id)}
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

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs text-zinc-300 flex items-center gap-1.5">
                <GitPullRequest className="h-3.5 w-3.5 text-sky-400" />
                GitHub PR URL (Optional)
              </Label>
              <Input
                value={prUrlDraft}
                onChange={(e) => setPrUrlDraft(e.target.value)}
                placeholder="https://github.com/your-org/repo/pull/..."
                className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!allDodChecked || isPending}
                onClick={handleCompleteTask}
                className={cn(
                  'h-8 text-xs font-semibold gap-1.5 cursor-pointer',
                  allDodChecked
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                )}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : allDodChecked ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {allDodChecked ? 'Mark Task Complete' : 'Check All DoD Items First'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
