'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { DoDItem, PriorityLevel, TaskStatus } from '@/types/database';

function revalidateWorkspace() {
  revalidatePath('/projects');
  revalidatePath('/roadmap');
  revalidatePath('/');
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const teamId = String(formData.get('teamId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const weekIdRaw = String(formData.get('weekId') ?? '');
  const ownerIdRaw = String(formData.get('ownerId') ?? 'shared');
  const priority = (formData.get('priority') as PriorityLevel) || 'high';
  const dueDateRaw = String(formData.get('dueDate') ?? '').trim();
  const dodRaw = String(formData.get('customDod') ?? '').trim();

  if (!title || !teamId) {
    return { error: 'Task title is required.' };
  }

  // Parse custom newline-separated DoD items or fall back to standard engineering DoD
  const dodLines = dodRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const definition_of_done: DoDItem[] =
    dodLines.length > 0
      ? dodLines.map((label, idx) => ({
          id: `dod-${Date.now()}-${idx}`,
          label,
          checked: false,
        }))
      : [
          { id: 'works', label: 'Implementation works end-to-end', checked: false },
          { id: 'validation', label: 'Input validation & error handling added', checked: false },
          { id: 'tests', label: 'Normal and failure test cases pass', checked: false },
          { id: 'reviewed', label: 'Peer reviewed by teammate', checked: false },
          { id: 'docs', label: 'Run instructions documented', checked: false },
        ];

  const { error } = await supabase.from('tasks').insert({
    team_id: teamId,
    week_id: weekIdRaw === 'none' || !weekIdRaw ? null : weekIdRaw,
    owner_id: ownerIdRaw === 'shared' ? null : ownerIdRaw,
    title,
    description: description || null,
    priority,
    status: 'backlog',
    due_date: dueDateRaw || null,
    definition_of_done,
  });

  if (error) return { error: error.message };

  revalidateWorkspace();
  return { success: true };
}

export async function updateTaskDoDAndMeta(
  taskId: string,
  definitionOfDone: DoDItem[],
  githubPrUrl: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .update({
      definition_of_done: definitionOfDone,
      github_pr_url: githubPrUrl?.trim() || null,
    })
    .eq('id', taskId);

  if (error) {
    return { error: error.message };
  }

  revalidateWorkspace();
  return { success: true };
}

export async function updateTaskStatus(taskId: string, nextStatus: TaskStatus) {
  const supabase = await createClient();

  // Fetch existing task to enforce the Definition of Done gate
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('definition_of_done')
    .eq('id', taskId)
    .single();

  if (fetchError || !task) {
    return { error: 'Task not found.' };
  }

  const dod = (task.definition_of_done as DoDItem[]) ?? [];
  const allChecked = dod.every((item) => item.checked === true);

  if (nextStatus === 'done' && !allChecked) {
    return {
      error:
        'Definition of Done Gate: All acceptance criteria must be checked off before marking a task Done.',
    };
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      status: nextStatus,
      completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId);

  if (error) {
    return { error: error.message };
  }

  revalidateWorkspace();
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) return { error: error.message };

  revalidateWorkspace();
  return { success: true };
}
