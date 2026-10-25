'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName =
    String(formData.get('fullName') ?? '').trim() || email.split('@')[0];

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName.split(' ')[0],
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const { data: teamData } = await supabase
      .from('teams')
      .select('id')
      .limit(1)
      .maybeSingle();
    const teamId = teamData?.id ?? null;

    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        team_id: teamId,
        full_name: fullName,
        display_name: fullName.split(' ')[0],
        role: 'FDE Candidate',
      },
      { onConflict: 'id' }
    );
  }

  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/');
  }

  return {
    success: true,
    message: 'Account created! Please sign in with your credentials.',
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function updateActiveWeek(teamId: string, weekNumber: number) {
  if (weekNumber < 1 || weekNumber > 12) {
    throw new Error('Week number must be between 1 and 12');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('teams')
    .update({ active_week: weekNumber })
    .eq('id', teamId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/', 'layout');
}
