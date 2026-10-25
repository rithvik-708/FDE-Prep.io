import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  TeamWorkspace,
  type DecisionRow,
  type NoteRow,
} from '@/components/team/team-workspace';
import { Users2 } from 'lucide-react';
import type { Profile } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function TeamWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single();

  const teamId = profile?.team_id;

  if (!teamId) {
    return (
      <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
        No team found for your user profile. Please ensure Phase 0 bootstrap is complete.
      </div>
    );
  }

  const [{ data: teammatesData }, { data: decisionsData }, { data: notesData }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('team_id', teamId)
        .order('display_name', { ascending: true }),
      supabase
        .from('decisions')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false }),
      supabase
        .from('notes')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false }),
    ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            Squad Engineering Memory
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mt-1">
          Team Workspace & Architecture Decisions
        </h1>
      </div>

      <TeamWorkspace
        teamId={teamId}
        currentUserId={user.id}
        teammates={(teammatesData as Profile[]) ?? []}
        decisions={(decisionsData as unknown as DecisionRow[]) ?? []}
        notes={(notesData as unknown as NoteRow[]) ?? []}
      />
    </div>
  );
}
