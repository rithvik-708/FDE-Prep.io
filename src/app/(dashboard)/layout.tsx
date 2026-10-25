import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import type { Profile, Team } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch current logged-in user's profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  let typedProfile = currentProfile as Profile | null;

  // Auto-healing fallback: If user row is missing or team_id is null, link to default team
  if (!typedProfile || !typedProfile.team_id) {
    const { data: defaultTeam } = await supabase
      .from('teams')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (defaultTeam?.id) {
      const fullName =
        (user.user_metadata?.full_name as string) ||
        (user.email ? user.email.split('@')[0] : 'Forward Deployed Engineer');
      const displayName =
        (user.user_metadata?.display_name as string) ||
        fullName.split(' ')[0];

      const { data: autoProfile } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            team_id: defaultTeam.id,
            full_name: fullName,
            display_name: displayName,
            role: 'Forward Deployed Engineer',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();

      if (autoProfile) {
        typedProfile = autoProfile as Profile;
      }
    }
  }

  if (!typedProfile || !typedProfile.team_id) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-xl p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-base font-bold font-mono text-amber-400">
              Profile Bootstrap Required
            </h2>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your Supabase Auth account (<code className="text-zinc-200">{user.id}</code>) is live,
            but no linked row was found in <code className="text-zinc-200">public.profiles</code>.
            Run the bootstrap block in your Supabase SQL Editor to link your account to the squad.
          </p>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto space-y-1">
            <p className="text-zinc-500">-- Run in Supabase SQL Editor:</p>
            <p>insert into public.profiles (id, team_id, full_name, display_name, role)</p>
            <p>select &apos;{user.id}&apos;::uuid, id, &apos;Rithvik Manne&apos;, &apos;Rithvik&apos;, &apos;Forward Deployed Engineer&apos;</p>
            <p>from public.teams limit 1</p>
            <p>on conflict (id) do update set team_id = excluded.team_id;</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch shared team metadata and all squad members in parallel
  const [{ data: teamData }, { data: teammatesData }] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .eq('id', typedProfile.team_id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('team_id', typedProfile.team_id)
      .order('display_name', { ascending: true }),
  ]);

  const team = teamData as Team | null;
  const activeWeek = team?.active_week ?? 1;
  const teamName = team?.name ?? 'FDE Prep Squad';
  const squadMembers = (teammatesData as Profile[] | null) ?? [typedProfile];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentUser={typedProfile}
        teammates={squadMembers}
        activeWeek={activeWeek}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={typedProfile}
          teamId={typedProfile.team_id}
          teamName={teamName}
          activeWeek={activeWeek}
        />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
