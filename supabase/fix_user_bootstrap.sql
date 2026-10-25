-- ============================================================================
-- FIX: BOOTSTRAP USER PROFILE & LINK TO TEAM
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vlskwfbnihphxqsszizn/sql
-- ============================================================================

do $$
declare
  v_team_id uuid;
  v_auth_user_id uuid := '8b51967a-b0a3-41b5-b646-1036538b004c';
  v_user_email text;
  v_user_name text;
  v_old_user_1 uuid;
begin
  -- 1. Ensure Team Exists
  select id into v_team_id from public.teams limit 1;
  if v_team_id is null then
    insert into public.teams (name, active_week)
    values ('FDE Prep Squad', 1)
    returning id into v_team_id;
  end if;

  -- 2. Fetch email and full name from auth.users
  select 
    email,
    coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Rithvik')
  into v_user_email, v_user_name
  from auth.users
  where id = v_auth_user_id;

  -- 3. Upsert Profile for your authenticated account
  insert into public.profiles (
    id,
    team_id,
    full_name,
    display_name,
    role,
    current_streak,
    last_active_date
  )
  values (
    v_auth_user_id,
    v_team_id,
    coalesce(v_user_name, 'Rithvik Manne'),
    coalesce(split_part(v_user_name, ' ', 1), 'Rithvik'),
    'Forward Deployed Engineer',
    0,
    null
  )
  on conflict (id) do update set
    team_id = v_team_id,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    display_name = coalesce(excluded.display_name, public.profiles.display_name);

  -- 4. Reassign tasks, notes, decisions, and attempts from any orphan dummy profile to your actual account
  select id into v_old_user_1
  from public.profiles
  where team_id = v_team_id
    and id != v_auth_user_id
    and display_name not ilike '%alex%'
    and display_name not ilike '%partner%'
  limit 1;

  if v_old_user_1 is not null then
    update public.tasks set owner_id = v_auth_user_id where owner_id = v_old_user_1;
    update public.decisions set author_id = v_auth_user_id where author_id = v_old_user_1;
    update public.notes set author_id = v_auth_user_id where author_id = v_old_user_1;
    update public.question_attempts set user_id = v_auth_user_id where user_id = v_old_user_1;
    update public.resource_progress set user_id = v_auth_user_id where user_id = v_old_user_1;
  end if;

  -- 5. If tasks had no owner, assign them to your account
  update public.tasks set owner_id = v_auth_user_id where owner_id is null;

  raise notice 'Successfully linked profile % to team %', v_auth_user_id, v_team_id;
end $$;

-- 6. Allow authenticated users to view team metadata so self-healing bootstrap works
drop policy if exists "Team members can view their team" on public.teams;
drop policy if exists "Authenticated users can view teams" on public.teams;
create policy "Authenticated users can view teams" on public.teams
  for select to authenticated using (true);

-- 7. Ensure future signups are automatically linked to the default team
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_default_team_id uuid;
begin
  select id into v_default_team_id from public.teams limit 1;
  insert into public.profiles (id, team_id, full_name, display_name, role)
  values (
    new.id,
    v_default_team_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'Forward Deployed Engineer'
  )
  on conflict (id) do update set
    team_id = coalesce(public.profiles.team_id, v_default_team_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
