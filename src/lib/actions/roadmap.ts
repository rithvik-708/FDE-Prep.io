'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { LearningObjective, PriorityLevel } from '@/types/database';

export async function toggleLearningObjective(
  weekId: string,
  objectiveId: string,
  weekNumber: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Fetch current learning_objectives JSONB array
  const { data: week, error: fetchError } = await supabase
    .from('roadmap_weeks')
    .select('learning_objectives')
    .eq('id', weekId)
    .single();

  if (fetchError || !week) {
    throw new Error(fetchError?.message ?? 'Roadmap week not found');
  }

  const objectives = (week.learning_objectives as LearningObjective[]) ?? [];
  let isNowCompleted = false;

  // 2. Toggle current user's UUID inside completed_by[]
  const updatedObjectives = objectives.map((obj) => {
    if (obj.id !== objectiveId) return obj;
    const completedBy = Array.isArray(obj.completed_by) ? obj.completed_by : [];
    const hasCompleted = completedBy.includes(user.id);

    if (!hasCompleted) {
      isNowCompleted = true;
    }

    return {
      ...obj,
      completed_by: hasCompleted
        ? completedBy.filter((id) => id !== user.id)
        : [...completedBy, user.id],
    };
  });

  // 3. Persist updated JSONB array
  const { error: updateError } = await supabase
    .from('roadmap_weeks')
    .update({ learning_objectives: updatedObjectives })
    .eq('id', weekId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // 4. Bump streak if completing an objective
  if (isNowCompleted) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, last_active_date')
        .eq('id', user.id)
        .single();

      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const lastActive = profile.last_active_date;

        if (lastActive !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const newStreak = lastActive === yesterday ? (profile.current_streak || 0) + 1 : 1;

          await supabase
            .from('profiles')
            .update({
              current_streak: newStreak,
              last_active_date: today,
            })
            .eq('id', user.id);
        }
      }
    } catch {
      // Streak failure should not block objective completion
    }
  }

  revalidatePath('/roadmap');
  revalidatePath(`/roadmap/${weekNumber}`);
  revalidatePath('/');
}

export async function updateWeekNotes(
  weekId: string,
  notes: string,
  weekNumber: number
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('roadmap_weeks')
    .update({ notes })
    .eq('id', weekId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/roadmap/${weekNumber}`);
}

export async function createQuickWeekTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const teamId = String(formData.get('teamId') ?? '');
  const weekId = String(formData.get('weekId') ?? '');
  const weekNumber = Number(formData.get('weekNumber') ?? 1);
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const ownerIdRaw = String(formData.get('ownerId') ?? 'shared');
  const priority = (formData.get('priority') as PriorityLevel) || 'high';

  if (!title || !teamId || !weekId) {
    return { error: 'Task title is required.' };
  }

  const owner_id = ownerIdRaw === 'shared' ? null : ownerIdRaw;

  const { error } = await supabase.from('tasks').insert({
    team_id: teamId,
    week_id: weekId,
    owner_id,
    title,
    description: description || null,
    priority,
    status: 'backlog',
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/roadmap/${weekNumber}`);
  revalidatePath('/roadmap');
  revalidatePath('/projects');
  revalidatePath('/');
  return { success: true };
}
