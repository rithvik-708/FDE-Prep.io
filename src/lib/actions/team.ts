'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { touchUserStreak } from '@/lib/actions/dashboard';

export async function createDecision(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const teamId = String(formData.get('teamId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const alternativesConsidered = String(
    formData.get('alternativesConsidered') ?? ''
  ).trim();
  const rationale = String(formData.get('rationale') ?? '').trim();
  const tradeoffs = String(formData.get('tradeoffs') ?? '').trim();
  const reconsiderConditions = String(
    formData.get('reconsiderConditions') ?? ''
  ).trim();

  if (
    !title ||
    !alternativesConsidered ||
    !rationale ||
    !tradeoffs ||
    !reconsiderConditions
  ) {
    return {
      error:
        'All 5 ADR fields are required so you can defend this decision in interviews.',
    };
  }

  const { error } = await supabase.from('decisions').insert({
    team_id: teamId,
    author_id: user.id,
    title,
    alternatives_considered: alternativesConsidered,
    rationale,
    tradeoffs,
    reconsider_conditions: reconsiderConditions,
  });

  if (error) return { error: error.message };

  await touchUserStreak();
  revalidatePath('/team');
  revalidatePath('/');
  return { success: true };
}

export async function createTeamNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const teamId = String(formData.get('teamId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const noteType = String(formData.get('noteType') ?? 'retrospective');
  const isShared = formData.get('visibility') !== 'private';

  if (!title || !content) {
    return { error: 'Title and content are required.' };
  }

  const { error } = await supabase.from('notes').insert({
    team_id: teamId,
    author_id: user.id,
    title,
    content,
    note_type: noteType,
    is_shared: isShared,
  });

  if (error) return { error: error.message };

  revalidatePath('/team');
  return { success: true };
}

export async function deleteTeamNote(noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) return { error: error.message };

  revalidatePath('/team');
  return { success: true };
}
