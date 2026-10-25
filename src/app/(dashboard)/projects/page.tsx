import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FolderGit2, KanbanSquare, ShieldCheck } from 'lucide-react';
import type { Profile, RoadmapWeek, Task, Project } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ProjectsAndTasksPage() {
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
  const activeWeekNumber = (profile?.teams as { active_week?: number } | null)?.active_week ?? 1;

  // Fetch tasks, teammates, roadmap weeks, and flagship project in parallel
  const [
    { data: tasksData },
    { data: teammatesData },
    { data: weeksData },
    { data: projectsData },
  ] = await Promise.all([
    teamId
      ? supabase
          .from('tasks')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
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
          .select('id, week_number, title')
          .eq('team_id', teamId)
          .order('week_number', { ascending: true })
      : Promise.resolve({ data: [] }),
    teamId
      ? supabase
          .from('projects')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const tasks = (tasksData as Task[]) ?? [];
  const teammates = (teammatesData as Profile[]) ?? [];
  const weeks =
    (weeksData as Pick<RoadmapWeek, 'id' | 'week_number' | 'title'>[]) ?? [];
  const flagshipProject = (projectsData as Project[])?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Shared Engineering Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mt-1">
            Projects & Task Board
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Definition of Done Gate Active: Tasks require verified tests, peer review, and docs before closing.
          </p>
        </div>

        {teamId && (
          <CreateTaskDialog
            teamId={teamId}
            teammates={teammates}
            weeks={weeks}
            activeWeekNumber={activeWeekNumber}
          />
        )}
      </div>

      {/* Flagship Project Banner */}
      {flagshipProject && (
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-mono uppercase text-sky-400">
                Flagship FDE Portfolio System
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-emerald-500/30 text-emerald-300"
              >
                ACTIVE BUILD
              </Badge>
            </div>
            <h2 className="text-sm font-bold text-zinc-100">
              {flagshipProject.name}
            </h2>
            <p className="text-xs text-zinc-400">
              {flagshipProject.description}
            </p>
          </div>

          {flagshipProject.repo_url && (
            <a
              href={flagshipProject.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5 shrink-0"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            </a>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        initialTasks={tasks}
        teammates={teammates}
        weeks={weeks}
        currentUserId={user?.id ?? ''}
      />
    </div>
  );
}
