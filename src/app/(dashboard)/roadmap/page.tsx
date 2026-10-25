import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LearningObjective, RoadmapWeek } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function RoadmapOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id, teams(active_week)')
    .eq('id', user?.id ?? '')
    .single();

  const teamId = profile?.team_id;
  const activeWeek = (profile?.teams as { active_week?: number } | null)?.active_week ?? 1;

  // Fetch all 12 roadmap weeks, tasks, and resources in parallel
  const [{ data: weeks }, { data: tasks }, { data: resources }] =
    await Promise.all([
      teamId
        ? supabase
            .from('roadmap_weeks')
            .select('*')
            .eq('team_id', teamId)
            .order('week_number', { ascending: true })
        : Promise.resolve({ data: [] }),
      teamId
        ? supabase
            .from('tasks')
            .select('id, week_id, status')
            .eq('team_id', teamId)
        : Promise.resolve({ data: [] }),
      teamId
        ? supabase
            .from('resources')
            .select('id, week_id')
            .eq('team_id', teamId)
        : Promise.resolve({ data: [] }),
    ]);

  const roadmapWeeks = (weeks as RoadmapWeek[]) ?? [];
  const allTasks = tasks ?? [];
  const allResources = resources ?? [];

  // Group weeks by phase_number (1 to 6)
  const phases = Array.from({ length: 6 }, (_, i) => {
    const phaseNumber = i + 1;
    const phaseWeeks = roadmapWeeks.filter((w) => w.phase_number === phaseNumber);
    return {
      phaseNumber,
      phaseTitle: phaseWeeks[0]?.phase_title ?? `Phase ${phaseNumber}`,
      weeks: phaseWeeks,
    };
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              12-Week Preparation Spine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mt-1">
            FDE Learning & Build Roadmap
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Structured across 6 engineering phases for Palantir and AI Startup Forward Deployed roles.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <div className="text-xs">
            <span className="text-zinc-400">Current Team Sprint: </span>
            <Link
              href={`/roadmap/${activeWeek}`}
              className="font-mono font-bold text-emerald-400 hover:underline"
            >
              Week {activeWeek} / 12 →
            </Link>
          </div>
        </div>
      </div>

      {roadmapWeeks.length === 0 ? (
        <Card className="bg-zinc-900/60 border-zinc-800 p-6">
          <p className="text-sm text-zinc-300 font-medium">
            No roadmap weeks found in Supabase yet.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Run <code className="text-emerald-400">supabase/seed_roadmap.sql</code> in your Supabase SQL Editor to populate all 6 phases and 12 weeks.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {phases.map((phase) => (
            <section key={phase.phaseNumber} className="space-y-3">
              {/* Phase Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <Badge
                    variant="outline"
                    className="font-mono text-[11px] bg-zinc-900 border-zinc-700 text-zinc-200"
                  >
                    PHASE {phase.phaseNumber}
                  </Badge>
                  <h2 className="text-base font-bold text-zinc-100">
                    {phase.phaseTitle}
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  Weeks {phase.phaseNumber * 2 - 1}–{phase.phaseNumber * 2}
                </span>
              </div>

              {/* 2-Column Week Cards per Phase */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {phase.weeks.map((week) => {
                  const isActive = week.week_number === activeWeek;
                  const objectives =
                    (week.learning_objectives as LearningObjective[]) ?? [];
                  const completedObjectivesCount = objectives.filter(
                    (o) =>
                      Array.isArray(o.completed_by) && o.completed_by.length > 0
                  ).length;

                  const weekTasks = allTasks.filter((t) => t.week_id === week.id);
                  const doneTasksCount = weekTasks.filter(
                    (t) => t.status === 'done'
                  ).length;
                  const weekResourcesCount = allResources.filter(
                    (r) => r.week_id === week.id
                  ).length;

                  const totalUnits = objectives.length + weekTasks.length;
                  const completedUnits =
                    completedObjectivesCount + doneTasksCount;
                  const progressPct =
                    totalUnits > 0
                      ? Math.round((completedUnits / totalUnits) * 100)
                      : 0;

                  return (
                    <Link
                      key={week.id}
                      href={`/roadmap/${week.week_number}`}
                      className="block group"
                    >
                      <Card
                        className={cn(
                          'h-full transition-all border',
                          isActive
                            ? 'bg-zinc-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                            : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
                        )}
                      >
                        <CardHeader className="pb-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200">
                                WEEK {week.week_number}
                              </span>
                              {isActive && (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                                  ACTIVE SPRINT
                                </Badge>
                              )}
                            </div>

                            <span className="text-xs font-mono text-zinc-400">
                              {progressPct}%
                            </span>
                          </div>

                          <CardTitle className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                            <span>{week.title}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <Progress value={progressPct} className="h-1.5 bg-zinc-950" />

                          {/* Joint Deliverable Callout */}
                          <div className="p-2.5 rounded-md bg-zinc-950/80 border border-zinc-800/80">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">
                              Joint Deliverable
                            </span>
                            <p className="text-xs text-zinc-300 line-clamp-2">
                              {week.joint_deliverable}
                            </p>
                          </div>

                          {/* Metadata Footer */}
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                {completedObjectivesCount}/{objectives.length} Obj
                              </span>
                              <span className="flex items-center gap-1">
                                <FolderGit2 className="h-3.5 w-3.5 text-sky-400" />
                                {doneTasksCount}/{weekTasks.length} Tasks
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                                {weekResourcesCount} Links
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
