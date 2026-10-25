-- ============================================================================
-- FDE PREP HUB: RESET ALL PROGRESS TO ZERO (CLEAN SLATE DASHBOARD)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vlskwfbnihphxqsszizn/sql
-- ============================================================================

do $$
declare
  v_team_id uuid;
begin
  select id into v_team_id from public.teams limit 1;

  -- 1. Reset Profile Streaks and Activity Dates to 0 / null
  update public.profiles
  set current_streak = 0,
      last_active_date = null;

  -- 2. Reset Team Active Week to Week 1
  if v_team_id is not null then
    update public.teams
    set active_week = 1
    where id = v_team_id;
  end if;

  -- 3. Reset All Tasks to 'backlog', clear completion timestamps, and uncheck all DoD items
  update public.tasks
  set status = 'backlog',
      completed_at = null,
      definition_of_done = (
        select coalesce(
          jsonb_agg(jsonb_set(elem, '{checked}', 'false'::jsonb)),
          '[]'::jsonb
        )
        from jsonb_array_elements(definition_of_done) elem
      );

  -- 4. Reset All 12 Roadmap Weeks Learning Objectives (clears all completed_by user IDs)
  update public.roadmap_weeks
  set learning_objectives = (
    select coalesce(
      jsonb_agg(jsonb_set(elem, '{completed_by}', '[]'::jsonb)),
      '[]'::jsonb
    )
    from jsonb_array_elements(learning_objectives) elem
  );

  -- 5. Clear All Resource Review Progress (sets reviewed resources count to 0)
  delete from public.resource_progress;

  -- 6. Clear All Interview Question Practice Attempts & Mock Interviews
  delete from public.question_attempts;
  delete from public.mock_interviews;

  raise notice 'Successfully reset all progress metrics to 0. Ready for day 1 prep!';
end $$;
