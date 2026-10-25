import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  TodaysPlanWidget,
  type DashboardResourceItem,
} from '@/components/dashboard/todays-plan-widget';
import {
  SquadComparisonCard,
  type MemberProgressStats,
} from '@/components/dashboard/squad-comparison-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  GitCommit,
  ListTodo,
  Rocket,
  Target,
  Users,
} from 'lucide-react';
import type {
  DecisionRecord,
  LearningObjective,
  MockInterview,
  Profile,
  ResourceStatus,
  RoadmapWeek,
  Task,
} from '@/types/database';

export const dynamic = 'force-dynamic';

interface ResourceWithNestedProgress {
  id: string;
  week_id: string | null;
  title: string;
  url: string;
  category: string;
  priority: Task['priority'];
  why_studying: string;
  progress: {
    user_id: string;
    status: ResourceStatus;
  }[];
}

export default async function CommandCentreDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*, teams(id, name, active_week)')
    .eq('id', user?.id ?? '')
    .single();

  const typedProfile = currentProfile as Profile | null;
  const teamId = typedProfile?.team_id;
  const activeWeek: number =
    (currentProfile?.teams as { active_week?: number } | null)?.active_week ?? 1;
  const todayIso = new Date().toISOString().split('T')[0];

  // Fetch all workspace state in parallel
  const [
    { data: teammatesData },
    { data: weeksData },
    { data: tasksData },
    { data: resourcesData },
    { data: upcomingMocksData },
    { data: recentDecisionsData },
  ] = await Promise.all([
    teamId
      ? supabase
          .from('profiles')
          .select('*')
          .eq('team_id', teamId)
          .order('display_name', { ascending: true })
      : Promise.resolve({ data: [] }),
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
          .select('*')
          .eq('team_id', teamId)
          .order('due_date', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    teamId
      ? supabase
          .from('resources')
          .select('*, progress:resource_progress(user_id, status)')
          .eq('team_id', teamId)
      : Promise.resolve({ data: [] }),
    teamId
      ? supabase
          .from('mock_interviews')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true })
          .limit(2)
      : Promise.resolve({ data: [] }),
    teamId
      ? supabase
          .from('decisions')
          .select('id, title, created_at')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const teammates = (teammatesData as Profile[]) ?? [];
  const weeks = (weeksData as RoadmapWeek[]) ?? [];
  const allTasks = (tasksData as Task[]) ?? [];
  const allResources = (resourcesData as unknown as ResourceWithNestedProgress[]) ?? [];
  const upcomingMocks = (upcomingMocksData as MockInterview[]) ?? [];
  const recentDecisions = (recentDecisionsData as Pick<DecisionRecord, 'id' | 'title' | 'created_at'>[]) ?? [];

  const activeWeekRecord = weeks.find((w) => w.week_number === activeWeek);

  // 1. Overdue tasks across the team or owned by current user
  const overdueTasks = allTasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.due_date !== null &&
      t.due_date < todayIso &&
      (t.owner_id === user?.id || t.owner_id === null)
  );

  // 2. Today's Plan Tasks: My tasks (or shared) that are not done, prioritizing current week & overdue
  const myActiveTasks = allTasks
    .filter(
      (t) =>
        t.status !== 'done' &&
        (t.owner_id === user?.id || t.owner_id === null) &&
        (t.week_id === activeWeekRecord?.id ||
          (t.due_date !== null && t.due_date <= todayIso))
    )
    .slice(0, 6);

  // 3. Today's Study Queue: Resources for activeWeek not yet marked 'reviewed' by current user
  const weekResourcesForMe: DashboardResourceItem[] = allResources
    .filter((r) => r.week_id === activeWeekRecord?.id)
    .map((r) => {
      const myProg = r.progress?.find((p) => p.user_id === user?.id);
      return {
        id: r.id,
        title: r.title,
        url: r.url,
        category: r.category,
        priority: r.priority,
        why_studying: r.why_studying,
        myStatus: (myProg?.status as 'not_started' | 'in_progress' | 'reviewed') ?? 'not_started',
      };
    })
    .filter((r) => r.myStatus !== 'reviewed');

  // 4. Compute Side-by-Side Member Progress Stats
  const totalObjectivesAcrossCurriculum = weeks.reduce(
    (acc, w) =>
      acc + ((w.learning_objectives as LearningObjective[])?.length ?? 0),
    0
  );

  const memberStats: MemberProgressStats[] = teammates.map((member) => {
    const memberTasks = allTasks.filter(
      (t) => t.owner_id === member.id || t.owner_id === null
    );
    const memberDoneTasks = memberTasks.filter((t) => t.status === 'done');

    const weekMemberTasks = memberTasks.filter(
      (t) => t.week_id === activeWeekRecord?.id
    );
    const weekMemberDoneTasks = weekMemberTasks.filter(
      (t) => t.status === 'done'
    );

    const activeWeekObjectives =
      (activeWeekRecord?.learning_objectives as LearningObjective[]) ?? [];
    const weekObjectivesDone = activeWeekObjectives.filter((o) =>
      o.completed_by?.includes(member.id)
    ).length;

    const totalObjectivesDoneByMember = weeks.reduce((acc, w) => {
      const objs = (w.learning_objectives as LearningObjective[]) ?? [];
      return (
        acc + objs.filter((o) => o.completed_by?.includes(member.id)).length
      );
    }, 0);

    const reviewedResourcesCount = allResources.filter((r) =>
      r.progress?.some(
        (p) => p.user_id === member.id && p.status === 'reviewed'
      )
    ).length;

    const denominator =
      memberTasks.length +
      totalObjectivesAcrossCurriculum +
      allResources.length;
    const numerator =
      memberDoneTasks.length +
      totalObjectivesDoneByMember +
      reviewedResourcesCount;

    const overallReadinessPct =
      denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

    return {
      userId: member.id,
      displayName: member.display_name,
      isCurrentUser: member.id === user?.id,
      streak: member.current_streak ?? 0,
      weekTasksDone: weekMemberDoneTasks.length,
      weekTasksTotal: weekMemberTasks.length,
      weekObjectivesDone,
      weekObjectivesTotal: activeWeekObjectives.length,
      totalResourcesReviewed: reviewedResourcesCount,
      totalResourcesCount: allResources.length,
      overallReadinessPct,
    };
  });

  const myStats = memberStats.find((m) => m.isCurrentUser);
  const myRemainingTasksCount = allTasks.filter(
    (t) =>
      t.status !== 'done' && (t.owner_id === user?.id || t.owner_id === null)
  ).length;

  // 5. Recent Completed Tasks Activity Feed
  const recentlyCompletedTasks = allTasks
    .filter((t) => t.status === 'done')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Greeting & Quick Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Good morning, {currentProfile?.display_name ?? 'Operator'}.
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Your FDE preparation at a glance · Active Sprint:{' '}
            <span className="text-emerald-400 font-mono font-semibold">
              Week {activeWeek} / 12 ({activeWeekRecord?.phase_title ?? 'Curriculum'})
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/roadmap/${activeWeek}`}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 text-xs bg-zinc-900 border-zinc-800 hover:bg-zinc-800 cursor-pointer'
            )}
          >
            Week {activeWeek} Deep-Dive
            <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Overdue Alert Banner (Only visible if overdue tasks exist) */}
      {overdueTasks.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-red-200">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>
              <strong>Attention:</strong> You have{' '}
              <span className="font-mono font-bold underline">
                {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
              </span>{' '}
              requiring Definition of Done verification.
            </span>
          </div>
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-7 text-xs border-red-500/40 bg-red-950/40 text-red-200 hover:bg-red-900/50 cursor-pointer'
            )}
          >
            Resolve on Board →
          </Link>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/60 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-zinc-400">
              Your Readiness
            </CardTitle>
            <Target className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {myStats?.overallReadinessPct ?? 0}%
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Tasks + Objectives + Study Bank
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-zinc-400">
              Open Tasks
            </CardTitle>
            <ListTodo className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {myRemainingTasksCount} left
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {overdueTasks.length > 0 ? (
                <span className="text-red-400 font-mono">
                  {overdueTasks.length} overdue
                </span>
              ) : (
                'Zero overdue items'
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-zinc-400">
              Execution Streak
            </CardTitle>
            <Flame className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {currentProfile?.current_streak ?? 0} days
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Auto-increments when you ship
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-zinc-400">
              Week {activeWeek} Objectives
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-zinc-100">
              {myStats?.weekObjectivesDone ?? 0} /{' '}
              {myStats?.weekObjectivesTotal ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Mastered in current sprint
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Command Grid: Today's Plan (7 cols) + Milestone & Interviews (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Today's Plan + Side-by-Side Squad Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3 border-b border-zinc-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  TODAY&apos;S PLAN (WEEK {activeWeek} EXECUTION QUEUE)
                </CardTitle>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-zinc-700 text-zinc-300"
                >
                  LIVE SYNC
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <TodaysPlanWidget
                myActiveTasks={myActiveTasks}
                weekResources={weekResourcesForMe}
                activeWeek={activeWeek}
                todayIso={todayIso}
              />
            </CardContent>
          </Card>

          {/* Squad Comparison Card */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" />
                Squad Accountability & Momentum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SquadComparisonCard
                stats={memberStats}
                activeWeek={activeWeek}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Columns: This Week's Milestone, Upcoming Mock Interviews, Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* This Week's Joint Milestone */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-emerald-400" />
                  THIS WEEK&apos;S MILESTONE
                </CardTitle>
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  WEEK {activeWeek}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                <div className="text-xs font-mono text-emerald-400">
                  {activeWeekRecord?.title ?? `Week ${activeWeek}`}
                </div>
                <p className="text-xs text-zinc-100 font-medium leading-relaxed">
                  {activeWeekRecord?.joint_deliverable ??
                    'Seed the 12-week roadmap to view your weekly joint milestone.'}
                </p>
              </div>
              {activeWeekRecord?.practical_task && (
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                    Practical Benchmark
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {activeWeekRecord.practical_task}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Mock Interviews */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-amber-400" />
                  UPCOMING MOCK INTERVIEWS
                </CardTitle>
                <Link
                  href="/interviews"
                  className="text-[11px] font-mono text-emerald-400 hover:underline"
                >
                  Schedule →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {upcomingMocks.length === 0 ? (
                <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                  <div className="text-xs font-mono text-amber-400">
                    Saturday · 4:00 PM IST (Recommended Slot)
                  </div>
                  <p className="text-xs text-zinc-300">
                    No mock interview logged for this week yet. Schedule a 45-min Palantir Decomposition or AI Startup RAG debugging drill in Phase 5.
                  </p>
                </div>
              ) : (
                upcomingMocks.map((mock) => (
                  <div
                    key={mock.id}
                    className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono uppercase border-amber-500/30 text-amber-300"
                      >
                        {mock.track.replace('_', ' ')} · {mock.interview_type}
                      </Badge>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {new Date(mock.scheduled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Latest Team Activity & ADRs */}
          <Card className="bg-zinc-900/60 border-zinc-800/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-sky-400" />
                RECENT SQUAD SHIP LOG
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentlyCompletedTasks.length === 0 &&
              recentDecisions.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">
                  Completed tasks and architectural decisions will appear here automatically.
                </p>
              ) : (
                <>
                  {recentlyCompletedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800/70 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-zinc-300 truncate">
                        ✓ {t.title}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                        SHIPPED
                      </span>
                    </div>
                  ))}
                  {recentDecisions.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800/70 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-zinc-300 truncate">
                        ADR: {d.title}
                      </span>
                      <span className="text-[10px] font-mono text-sky-400 shrink-0">
                        DECISION
                      </span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
