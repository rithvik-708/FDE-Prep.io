import { createClient } from '@/lib/supabase/server';
import { ResourceHub } from '@/components/resources/resource-hub';
import { CreateResourceDialog } from '@/components/resources/create-resource-dialog';
import { Library } from 'lucide-react';
import type {
  Profile,
  ResourceWithProgress,
  RoadmapWeek,
} from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
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

  // Fetch resources with nested resource_progress, teammates, and weeks
  const [{ data: resourcesData }, { data: teammatesData }, { data: weeksData }] =
    await Promise.all([
      teamId
        ? supabase
            .from('resources')
            .select('*, progress:resource_progress(user_id, status, personal_notes)')
            .eq('team_id', teamId)
            .order('created_at', { ascending: true })
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
    ]);

  const resources = (resourcesData as ResourceWithProgress[]) ?? [];
  const teammates = (teammatesData as Profile[]) ?? [];
  const weeks =
    (weeksData as Pick<RoadmapWeek, 'id' | 'week_number' | 'title'>[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Curated Knowledge Bank
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mt-1">
            FDE Resource Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Every resource is anchored to an explicit engineering goal and tracks completion independently for each teammate.
          </p>
        </div>

        {teamId && (
          <CreateResourceDialog
            teamId={teamId}
            weeks={weeks}
            activeWeekNumber={activeWeekNumber}
          />
        )}
      </div>

      {/* Interactive Filterable Resource Grid */}
      <ResourceHub
        resources={resources}
        teammates={teammates}
        weeks={weeks}
        currentUserId={user?.id ?? ''}
      />
    </div>
  );
}
