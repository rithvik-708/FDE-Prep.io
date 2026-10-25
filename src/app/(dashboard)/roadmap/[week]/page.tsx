import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ObjectiveChecklist } from '@/components/roadmap/objective-checklist';
import { WeekNotesEditor } from '@/components/roadmap/week-notes-editor';
import { QuickTaskDialog } from '@/components/roadmap/quick-task-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  GitPullRequest,
  Rocket,
  Users,
} from 'lucide-react';
import type {
  LearningObjective,
  Profile,
  RoadmapWeek,
  Task,
  Resource,
} from '@/types/database';

export const dynamic = 'force-dynamic';

interface WeekDetailPageProps {
  params: Promise<{ week: string }>;
}

export default async function WeekDetailPage({ params }: WeekDetailPageProps) {
  const { week: weekParam } = await params;
  const weekNumber = Number(weekParam);

  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 12) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single();

  const typedProfile = currentProfile as Profile | null;
  const teamId = typedProfile?.team_id;

  if (!teamId) {
    notFound();
  }

  // Fetch the roadmap week record
  const { data: weekData } = await supabase
    .from('roadmap_weeks')
    .select('*')
    .eq('team_id', teamId)
    .eq('week_number', weekNumber)
    .maybeSingle();

  if (!weekData) {
    notFound();
  }

  const typedWeek = weekData as RoadmapWeek;

  // Fetch squad members, linked tasks, and linked resources in parallel
  const [{ data: teammatesData }, { data: tasksData }, { data: resourcesData }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .order('display_name', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .eq('team_id', teamId)
        .eq('week_id', typedWeek.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('resources')
        .select('*')
        .eq('team_id', teamId)
        .eq('week_id', typedWeek.id)
        .order('priority', { ascending: true }),
    ]);

  const teammates = (teammatesData as Profile[]) ?? [];
  const tasks = (tasksData as Task[]) ?? [];
  const resources = (resourcesData as Resource[]) ?? [];
  const objectives =
    (typedWeek.learning_objectives as LearningObjective[]) ?? [];

  // Partition tasks into Shared vs Individual per member
  const sharedTasks = tasks.filter((t) => t.owner_id === null);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Prev/Next Week Switcher */}
      <div className="flex items-center justify-between">
        <Link
          href="/roadmap"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-8 px-2 text-xs text-zinc-400 hover:text-zinc-100'
          )}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          All 12 Weeks
        </Link>

        <div className="flex items-center gap-2">
          {weekNumber > 1 && (
            <Link
              href={`/roadmap/${weekNumber - 1}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-8 text-xs bg-zinc-900 border-zinc-800'
              )}
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Week {weekNumber - 1}
            </Link>
          )}
          {weekNumber < 12 && (
            <Link
              href={`/roadmap/${weekNumber + 1}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-8 text-xs bg-zinc-900 border-zinc-800'
              )}
            >
              Week {weekNumber + 1}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Week Hero Header */}
      <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono text-xs">
              WEEK {typedWeek.week_number} OF 12
            </Badge>
            <Badge
              variant="outline"
              className="font-mono text-xs border-zinc-700 text-zinc-300"
            >
              PHASE {typedWeek.phase_number}: {typedWeek.phase_title.toUpperCase()}
            </Badge>
          </div>

          <QuickTaskDialog
            teamId={teamId}
            weekId={typedWeek.id}
            weekNumber={typedWeek.week_number}
            teammates={teammates}
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
          {typedWeek.title}
        </h1>

        {/* Practical Exercise & Joint Deliverable Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-zinc-950/90 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-sky-400">
              <Code2 className="h-4 w-4" />
              <span>Practical Engineering Exercise</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {typedWeek.practical_task}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400">
              <Rocket className="h-4 w-4" />
              <span>Joint Squad Deliverable</span>
            </div>
            <p className="text-xs text-zinc-200 font-medium leading-relaxed">
              {typedWeek.joint_deliverable}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Objectives + Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Learning Objectives & Task Ownership Split */}
        <div className="lg:col-span-7 space-y-6">
          {/* Learning Objectives Card */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Learning Objectives Checklist
                </CardTitle>
                <span className="text-[11px] font-mono text-zinc-400">
                  Click to toggle your mastery
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ObjectiveChecklist
                weekId={typedWeek.id}
                weekNumber={typedWeek.week_number}
                objectives={objectives}
                currentUserId={typedProfile.id}
                teammates={teammates}
              />
            </CardContent>
          </Card>

          {/* Individual & Shared Assignments Breakdown */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-400" />
                  Week {typedWeek.week_number} Task Ownership Split
                </CardTitle>
                <Link
                  href="/projects"
                  className="text-xs font-mono text-emerald-400 hover:underline"
                >
                  Open Kanban Board →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Individual Columns for Teammates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teammates.map((member) => {
                  const memberTasks = tasks.filter(
                    (t) => t.owner_id === member.id
                  );
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-mono font-bold text-zinc-200">
                          {member.display_name}&apos;s Tasks
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-zinc-700 text-zinc-400"
                        >
                          {memberTasks.filter((t) => t.status === 'done').length}/
                          {memberTasks.length} Done
                        </Badge>
                      </div>

                      {memberTasks.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 py-2">
                          No individual tasks assigned yet.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {memberTasks.map((t) => (
                            <li
                              key={t.id}
                              className="text-xs flex items-start justify-between gap-2 p-2 rounded bg-zinc-900/70 border border-zinc-800/60"
                            >
                              <span
                                className={
                                  t.status === 'done'
                                    ? 'line-through text-zinc-500'
                                    : 'text-zinc-200'
                                }
                              >
                                {t.title}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 shrink-0">
                                {t.status.replace('_', ' ')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Shared / Joint Tasks */}
              <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                    <GitPullRequest className="h-3.5 w-3.5 text-emerald-400" />
                    Shared Team Tasks
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {sharedTasks.length} items
                  </span>
                </div>
                {sharedTasks.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 py-1">
                    Use &ldquo;Add Week {typedWeek.week_number} Task&rdquo; above to break the joint deliverable into subtasks.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {sharedTasks.map((t) => (
                      <li
                        key={t.id}
                        className="text-xs flex items-center justify-between gap-2 p-2 rounded bg-zinc-900/70 border border-zinc-800/60"
                      >
                        <span
                          className={
                            t.status === 'done'
                              ? 'line-through text-zinc-500'
                              : 'text-zinc-200'
                          }
                        >
                          {t.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400">
                          {t.status.replace('_', ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Columns: Connected Resources & Shared Week Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Study Resources for this Week */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  Week {typedWeek.week_number} Study Resources
                </CardTitle>
                <Link
                  href="/resources"
                  className="text-xs font-mono text-emerald-400 hover:underline"
                >
                  Full Library →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.length === 0 ? (
                <div className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-400">
                  No resources linked to Week {typedWeek.week_number} yet. Add or seed them in Phase 3.
                </div>
              ) : (
                resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-zinc-100 hover:text-emerald-400 flex items-center gap-1.5"
                      >
                        <span>{res.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-zinc-700 text-zinc-400"
                      >
                        {res.resource_type}
                      </Badge>
                    </div>
                    <div className="p-2 rounded bg-zinc-900/90 border-l-2 border-emerald-500 text-[11px] text-zinc-300">
                      <span className="font-mono text-[10px] uppercase text-emerald-400 block">
                        Why we are studying this:
                      </span>
                      {res.why_studying}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Shared Notes & Lessons Learned */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                Notes & Lessons Learned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeekNotesEditor
                weekId={typedWeek.id}
                weekNumber={typedWeek.week_number}
                initialNotes={typedWeek.notes}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
