'use client';

import { useTransition } from 'react';
import { toggleLearningObjective } from '@/lib/actions/roadmap';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { LearningObjective, Profile } from '@/types/database';

interface ObjectiveChecklistProps {
  weekId: string;
  weekNumber: number;
  objectives: LearningObjective[];
  currentUserId: string;
  teammates: Profile[];
}

export function ObjectiveChecklist({
  weekId,
  weekNumber,
  objectives,
  currentUserId,
  teammates,
}: ObjectiveChecklistProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (objectiveId: string) => {
    startTransition(async () => {
      await toggleLearningObjective(weekId, objectiveId, weekNumber);
    });
  };

  return (
    <div className="space-y-2.5">
      {objectives.map((obj, index) => {
        const completedBy = Array.isArray(obj.completed_by)
          ? obj.completed_by
          : [];
        const isCheckedByMe = completedBy.includes(currentUserId);

        return (
          <div
            key={obj.id}
            onClick={() => !isPending && handleToggle(obj.id)}
            className={cn(
              'p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-4',
              isCheckedByMe
                ? 'bg-emerald-950/15 border-emerald-500/30'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={isCheckedByMe}
                disabled={isPending}
                onCheckedChange={() => handleToggle(obj.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 data-checked:bg-emerald-500 data-checked:border-emerald-500 data-checked:text-zinc-950"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Objective {index + 1}
                </span>
                <p
                  className={cn(
                    'text-xs leading-relaxed',
                    isCheckedByMe
                      ? 'text-zinc-300 line-through decoration-emerald-500/50'
                      : 'text-zinc-100'
                  )}
                >
                  {obj.text}
                </p>
              </div>
            </div>

            {/* Dual Squad Completion Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {teammates.map((member) => {
                const done = completedBy.includes(member.id);
                return (
                  <div
                    key={member.id}
                    title={`${member.display_name}: ${done ? 'Completed' : 'Pending'}`}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono border transition-colors',
                      done
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    )}
                  >
                    {member.display_name} {done ? '✓' : '·'}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
