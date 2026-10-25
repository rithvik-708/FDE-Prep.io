'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  DifficultyLevel,
  PriorityLevel,
  ResourceStatus,
} from '@/types/database';

export async function createResource(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const teamId = String(formData.get('teamId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();
  const category = String(formData.get('category') ?? 'Applied AI');
  const resourceType = String(formData.get('resourceType') ?? 'Documentation');
  const priority = (formData.get('priority') as PriorityLevel) || 'high';
  const difficulty = (formData.get('difficulty') as DifficultyLevel) || 'medium';
  const weekIdRaw = String(formData.get('weekId') ?? '');
  const whyStudying = String(formData.get('whyStudying') ?? '').trim();

  if (!title || !url || !whyStudying) {
    return {
      error: 'Title, URL, and "Why are we studying this?" are required.',
    };
  }

  const { error } = await supabase.from('resources').insert({
    team_id: teamId,
    week_id: weekIdRaw === 'none' || !weekIdRaw ? null : weekIdRaw,
    title,
    url,
    category,
    resource_type: resourceType,
    priority,
    difficulty,
    is_free: true,
    why_studying: whyStudying,
  });

  if (error) return { error: error.message };

  revalidatePath('/resources');
  revalidatePath('/roadmap');
  return { success: true };
}

export async function upsertResourceProgress(
  resourceId: string,
  status: ResourceStatus,
  personalNotes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const payload: {
    resource_id: string;
    user_id: string;
    status: ResourceStatus;
    completed_at: string | null;
    personal_notes?: string;
  } = {
    resource_id: resourceId,
    user_id: user.id,
    status,
    completed_at: status === 'reviewed' ? new Date().toISOString() : null,
  };

  if (personalNotes !== undefined) {
    payload.personal_notes = personalNotes;
  }

  const { error } = await supabase
    .from('resource_progress')
    .upsert(payload, { onConflict: 'resource_id,user_id' });

  if (error) return { error: error.message };

  revalidatePath('/resources');
  revalidatePath('/roadmap');
  revalidatePath('/');
  return { success: true };
}
