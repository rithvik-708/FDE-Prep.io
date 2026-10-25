import { Progress } from '@/components/ui/progress';
import { Flame, CheckCircle2, BookOpen, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MemberProgressStats {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  streak: number;
  weekTasksDone: number;
  weekTasksTotal: number;
  weekObjectivesDone: number;
  weekObjectivesTotal: number;
  totalResourcesReviewed: number;
  totalResourcesCount: number;
  overallReadinessPct: number;
}

interface SquadComparisonCardProps {
  stats: MemberProgressStats[];
  activeWeek: number;
}

export function SquadComparisonCard({
  stats,
  activeWeek,
}: SquadComparisonCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((member) => (
        <div
          key={member.userId}
          className={cn(
            'p-4 rounded-xl border space-y-3.5',
            member.isCurrentUser
              ? 'bg-zinc-950/90 border-emerald-500/30'
              : 'bg-zinc-950/70 border-zinc-800/90'
          )}
        >
          {/* Header: Name + Streak + Readiness % */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-100">
                {member.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-100">
                    {member.displayName}
                  </span>
                  {member.isCurrentUser && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                  <Flame className="h-3 w-3 fill-amber-400/20" />
                  <span>{member.streak} day streak</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold font-mono text-emerald-400">
                {member.overallReadinessPct}%
              </span>
              <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                Overall Prep
              </span>
            </div>
          </div>

          <Progress
            value={member.overallReadinessPct}
            className="h-1.5 bg-zinc-900"
          />

          {/* 3-Metric Breakdown Pill Row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800/70">
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                <Code2 className="h-3 w-3 text-sky-400" />
                <span>W{activeWeek} Tasks</span>
              </div>
              <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                {member.weekTasksDone} / {member.weekTasksTotal}
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800/70">
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>W{activeWeek} Obj</span>
              </div>
              <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                {member.weekObjectivesDone} / {member.weekObjectivesTotal}
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800/70">
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                <BookOpen className="h-3 w-3 text-amber-400" />
                <span>Reviewed</span>
              </div>
              <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">
                {member.totalResourcesReviewed} / {member.totalResourcesCount}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
