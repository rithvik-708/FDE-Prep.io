'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { DoDItem, ResourceStatus, TaskStatus } from '@/types/database';

/**
 * Automatically updates the authenticated user's daily streak in `public.profiles`.
 * - If `last_active_date` is today: no change.
 * - If `last_active_date` was yesterday: increments `current_streak` by 1.
 * - Otherwise: resets `current_streak` to 1.
 */
export async function touchUserStreak() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, last_active_date')
    .eq('id', user.id)
    .single();

  if (!profile) return { error: 'Profile not found' };

  const todayStr = new Date().toISOString().split('T')[0];
  if (profile.last_active_date === todayStr) {
    return { streak: profile.current_streak };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const nextStreak =
    profile.last_active_date === yesterdayStr
      ? (profile.current_streak ?? 0) + 1
      : 1;

  await supabase
    .from('profiles')
    .update({
      current_streak: nextStreak,
      last_active_date: todayStr,
    })
    .eq('id', user.id);

  revalidatePath('/', 'layout');
  return { streak: nextStreak };
}

/**
 * Updates Definition of Done items from the Dashboard quick-modal and optionally marks the task Done.
 */
export async function quickUpdateTaskFromDashboard(
  taskId: string,
  updatedDod: DoDItem[],
  githubPrUrl: string | null,
  markAsDone: boolean
) {
  const supabase = await createClient();

  const allChecked =
    updatedDod.length > 0 && updatedDod.every((item) => item.checked === true);

  if (markAsDone && !allChecked) {
    return {
      error:
        'Definition of Done Gate: Check off all acceptance criteria before completing this task.',
    };
  }

  const nextStatus: TaskStatus | undefined = markAsDone ? 'done' : undefined;

  const updatePayload: {
    definition_of_done: DoDItem[];
    github_pr_url: string | null;
    status?: TaskStatus;
    completed_at?: string;
  } = {
    definition_of_done: updatedDod,
    github_pr_url: githubPrUrl?.trim() || null,
  };

  if (nextStatus === 'done') {
    updatePayload.status = 'done';
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId);

  if (error) {
    return { error: error.message };
  }

  await touchUserStreak();
  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/roadmap');
  return { success: true };
}

/**
 * Quick 1-click toggle to mark a study resource as 'reviewed' or 'in_progress' from Today's Plan.
 */
export async function quickMarkResourceStatus(
  resourceId: string,
  status: ResourceStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('resource_progress').upsert(
    {
      resource_id: resourceId,
      user_id: user.id,
      status,
      completed_at: status === 'reviewed' ? new Date().toISOString() : null,
    },
    { onConflict: 'resource_id,user_id' }
  );

  if (error) return { error: error.message };

  await touchUserStreak();
  revalidatePath('/');
  revalidatePath('/resources');
  revalidatePath('/roadmap');
  return { success: true };
}
