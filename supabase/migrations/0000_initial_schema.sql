-- ============================================================================
-- FDE PREP HUB: PHASE 0 INITIAL SCHEMA & RLS MIGRATION
-- ============================================================================

-- 1. Enable UUID extension
create extension if not exists "pgcrypto";

-- 2. Create Custom Enums
create type task_status as enum ('backlog', 'in_progress', 'review', 'done');
create type priority_level as enum ('low', 'medium', 'high', 'critical');
create type resource_status as enum ('not_started', 'in_progress', 'reviewed');
create type interview_track as enum ('palantir', 'ai_startup');
create type difficulty_level as enum ('easy', 'medium', 'hard');

-- 3. Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Table 1: Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'FDE Prep Squad',
  active_week integer not null default 1 check (active_week between 1 and 12),
  created_at timestamptz not null default now()
);

-- Table 2: Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  full_name text not null,
  display_name text not null,
  avatar_url text,
  role text not null default 'FDE Candidate',
  current_streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table 3: Roadmap Weeks (The 12-week spine)
create table public.roadmap_weeks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 12),
  phase_number integer not null check (phase_number between 1 and 6),
  phase_title text not null,
  title text not null,
  learning_objectives jsonb not null default '[]'::jsonb, -- Array of { id, text, completed_by: uuid[] }
  practical_task text not null,
  joint_deliverable text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, week_number)
);

-- Table 4: Projects (Portfolio & Flagship projects)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  description text,
  repo_url text,
  live_url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Table 5: Tasks (Kanban + Definition of Done)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_id uuid references public.roadmap_weeks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null, -- null = shared task
  title text not null,
  description text,
  status task_status not null default 'backlog',
  priority priority_level not null default 'medium',
  due_date date,
  github_pr_url text,
  -- JSONB array of { id: string, label: string, checked: boolean }
  definition_of_done jsonb not null default '[
    {"id": "works", "label": "Implementation works end-to-end", "checked": false},
    {"id": "tests", "label": "Normal and failure test cases pass", "checked": false},
    {"id": "reviewed", "label": "Peer reviewed by teammate", "checked": false},
    {"id": "docs", "label": "Run instructions documented", "checked": false}
  ]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table 6: Resources (Curated study links)
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_id uuid references public.roadmap_weeks(id) on delete set null,
  title text not null,
  url text not null,
  category text not null, -- e.g., 'Applied AI', 'Agents', 'System Design', 'AI Infra'
  resource_type text not null, -- e.g., 'Course', 'GitHub Repo', 'Docs', 'Paper'
  priority priority_level not null default 'high',
  difficulty difficulty_level not null default 'medium',
  is_free boolean not null default true,
  why_studying text not null, -- Crucial anti-tutorial-hell field
  created_at timestamptz not null default now()
);

-- Table 7: Resource Progress (Tracked separately per user!)
create table public.resource_progress (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status resource_status not null default 'not_started',
  personal_notes text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

-- Table 8: Interview Questions Bank
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  track interview_track not null,
  topic text not null, -- e.g., 'RAG Debugging', 'Decomposition', 'System Design'
  difficulty difficulty_level not null default 'medium',
  question_text text not null,
  -- Array of strings for self/peer check rubric
  review_checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Table 9: Question Attempts & Peer Reviews
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text not null,
  peer_reviewer_id uuid references public.profiles(id) on delete set null,
  peer_feedback text,
  confidence_rating integer check (confidence_rating between 1 and 5),
  last_reviewed_at timestamptz not null default now(),
  next_review_date date,
  unique (question_id, user_id)
);

-- Table 10: Mock Interviews
create table public.mock_interviews (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  interviewer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  track interview_track not null,
  interview_type text not null, -- e.g., 'System Design', 'Customer Discovery', 'Coding'
  scheduled_at timestamptz not null,
  status text not null default 'scheduled', -- 'scheduled', 'completed'
  overall_score integer check (overall_score between 1 and 5),
  rubric_scores jsonb not null default '{}'::jsonb,
  strengths text,
  improvements text,
  follow_up_tasks text,
  created_at timestamptz not null default now()
);

-- Table 11: Architecture Decision Records (ADRs)
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  alternatives_considered text not null,
  rationale text not null,
  tradeoffs text not null,
  reconsider_conditions text not null,
  created_at timestamptz not null default now()
);

-- Table 12: Notes & Retrospectives
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  week_id uuid references public.roadmap_weeks(id) on delete set null,
  title text not null,
  content text not null,
  is_shared boolean not null default true,
  note_type text not null default 'general', -- 'general', 'retrospective', 'meeting_agenda'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Attach updated_at triggers
create trigger set_profiles_updated_at before update on public.profiles for each row execute function update_updated_at_column();
create trigger set_roadmap_weeks_updated_at before update on public.roadmap_weeks for each row execute function update_updated_at_column();
create trigger set_tasks_updated_at before update on public.tasks for each row execute function update_updated_at_column();
create trigger set_resource_progress_updated_at before update on public.resource_progress for each row execute function update_updated_at_column();
create trigger set_notes_updated_at before update on public.notes for each row execute function update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper function: Get the authenticated user's team_id securely
create or replace function public.get_user_team_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

-- Enable RLS across all tables
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.roadmap_weeks enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.resources enable row level security;
alter table public.resource_progress enable row level security;
alter table public.interview_questions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.mock_interviews enable row level security;
alter table public.decisions enable row level security;
alter table public.notes enable row level security;

-- 1. Teams: Members can view and update their own team
create policy "Team members can view their team" on public.teams
  for select using (id = public.get_user_team_id());
create policy "Team members can update their team" on public.teams
  for update using (id = public.get_user_team_id());

-- 2. Profiles: Team members can view each other; users can update their own profile
create policy "Users can view own and teammates profiles" on public.profiles
  for select using (id = auth.uid() or team_id = public.get_user_team_id());
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- 3. Shared Team Tables (Full CRUD for members of the same team)
create policy "Team access on roadmap_weeks" on public.roadmap_weeks
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

create policy "Team access on projects" on public.projects
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

create policy "Team access on tasks" on public.tasks
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

create policy "Team access on resources" on public.resources
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

create policy "Team access on interview_questions" on public.interview_questions
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

create policy "Team access on mock_interviews" on public.mock_interviews
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

create policy "Team access on decisions" on public.decisions
  for all using (team_id = public.get_user_team_id()) with check (team_id = public.get_user_team_id());

-- 4. Resource Progress: Both teammates can view progress, but you can only mutate your own row
create policy "Teammates can view all resource progress" on public.resource_progress
  for select using (
    exists (
      select 1 from public.resources r
      where r.id = resource_progress.resource_id
      and r.team_id = public.get_user_team_id()
    )
  );
create policy "Users can upsert own resource progress" on public.resource_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5. Question Attempts: Both teammates can view and update (for peer feedback)
create policy "Team access on question_attempts" on public.question_attempts
  for all using (
    exists (
      select 1 from public.interview_questions q
      where q.id = question_attempts.question_id
      and q.team_id = public.get_user_team_id()
    )
  );

-- 6. Notes: Shared notes visible to team; private notes visible only to author
create policy "View shared or own private notes" on public.notes
  for select using (
    team_id = public.get_user_team_id() and (is_shared = true or author_id = auth.uid())
  );
create policy "Author or team can mutate shared notes" on public.notes
  for all using (
    team_id = public.get_user_team_id() and (is_shared = true or author_id = auth.uid())
  ) with check (team_id = public.get_user_team_id());
