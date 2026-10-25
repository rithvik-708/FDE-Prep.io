-- ============================================================================
-- FDE PREP HUB: COMPLETE DATABASE SETUP SCRIPT
-- Run this ONCE in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It creates all tables, RLS policies, triggers, users, and seeds the roadmap,
-- resources, tasks, interview questions, and ADRs.
-- ============================================================================

-- 1. Enable UUID Extension
create extension if not exists "pgcrypto";

-- 2. Create Custom Enums (Safe Creation)
do $$ begin
  create type task_status as enum ('backlog', 'in_progress', 'review', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_status as enum ('not_started', 'in_progress', 'reviewed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type interview_track as enum ('palantir', 'ai_startup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type difficulty_level as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

-- 3. Trigger Function for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 4. CORE TABLES
-- ============================================================================

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'FDE Prep Squad',
  active_week integer not null default 1 check (active_week between 1 and 12),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
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

create table if not exists public.roadmap_weeks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 12),
  phase_number integer not null check (phase_number between 1 and 6),
  phase_title text not null,
  title text not null,
  learning_objectives jsonb not null default '[]'::jsonb,
  practical_task text not null,
  joint_deliverable text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, week_number)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  description text,
  repo_url text,
  live_url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_id uuid references public.roadmap_weeks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'backlog',
  priority priority_level not null default 'medium',
  due_date date,
  github_pr_url text,
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

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  week_id uuid references public.roadmap_weeks(id) on delete set null,
  title text not null,
  url text not null,
  category text not null,
  resource_type text not null,
  priority priority_level not null default 'high',
  difficulty difficulty_level not null default 'medium',
  is_free boolean not null default true,
  why_studying text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_progress (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status resource_status not null default 'not_started',
  personal_notes text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  track interview_track not null,
  topic text not null,
  difficulty difficulty_level not null default 'medium',
  question_text text not null,
  review_checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.question_attempts (
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

create table if not exists public.mock_interviews (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  interviewer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  track interview_track not null,
  interview_type text not null,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled',
  overall_score integer check (overall_score between 1 and 5),
  rubric_scores jsonb not null default '{}'::jsonb,
  strengths text,
  improvements text,
  follow_up_tasks text,
  created_at timestamptz not null default now()
);

create table if not exists public.decisions (
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

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  week_id uuid references public.roadmap_weeks(id) on delete set null,
  title text not null,
  content text not null,
  is_shared boolean not null default true,
  note_type text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Updated_at Triggers
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function update_updated_at_column();

drop trigger if exists set_roadmap_weeks_updated_at on public.roadmap_weeks;
create trigger set_roadmap_weeks_updated_at before update on public.roadmap_weeks for each row execute function update_updated_at_column();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function update_updated_at_column();

drop trigger if exists set_resource_progress_updated_at on public.resource_progress;
create trigger set_resource_progress_updated_at before update on public.resource_progress for each row execute function update_updated_at_column();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at before update on public.notes for each row execute function update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

create or replace function public.get_user_team_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

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

-- Drop existing policies if re-running
drop policy if exists "Team members can view their team" on public.teams;
drop policy if exists "Team members can update their team" on public.teams;
drop policy if exists "Users can view own and teammates profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Team access on roadmap_weeks" on public.roadmap_weeks;
drop policy if exists "Team access on projects" on public.projects;
drop policy if exists "Team access on tasks" on public.tasks;
drop policy if exists "Team access on resources" on public.resources;
drop policy if exists "Team access on interview_questions" on public.interview_questions;
drop policy if exists "Team access on mock_interviews" on public.mock_interviews;
drop policy if exists "Team access on decisions" on public.decisions;
drop policy if exists "Teammates can view all resource progress" on public.resource_progress;
drop policy if exists "Users can upsert own resource progress" on public.resource_progress;
drop policy if exists "Team access on question_attempts" on public.question_attempts;
drop policy if exists "View shared or own private notes" on public.notes;
drop policy if exists "Author or team can mutate shared notes" on public.notes;

create policy "Team members can view their team" on public.teams
  for select using (id = public.get_user_team_id());
create policy "Team members can update their team" on public.teams
  for update using (id = public.get_user_team_id());

create policy "Users can view own and teammates profiles" on public.profiles
  for select using (id = auth.uid() or team_id = public.get_user_team_id());
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());

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

create policy "Team access on question_attempts" on public.question_attempts
  for all using (
    exists (
      select 1 from public.interview_questions q
      where q.id = question_attempts.question_id
      and q.team_id = public.get_user_team_id()
    )
  );

create policy "View shared or own private notes" on public.notes
  for select using (
    team_id = public.get_user_team_id() and (is_shared = true or author_id = auth.uid())
  );
create policy "Author or team can mutate shared notes" on public.notes
  for all using (
    team_id = public.get_user_team_id() and (is_shared = true or author_id = auth.uid())
  ) with check (team_id = public.get_user_team_id());

-- ============================================================================
-- 7. AUTOMATIC PROFILE TRIGGER ON USER SIGNUP
-- ============================================================================

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

-- ============================================================================
-- 8. BOOTSTRAP SQUAD (TEAM & OPERATORS)
-- ============================================================================

do $$
declare
  v_team_id uuid;
  v_user_1 uuid;
  v_user_2 uuid;
  v_encrypted_pw text := crypt('Rithvik@2006', gen_salt('bf'));
begin
  -- 1. Ensure Team Exists
  select id into v_team_id from public.teams limit 1;
  if v_team_id is null then
    insert into public.teams (name, active_week)
    values ('FDE Prep Squad', 1)
    returning id into v_team_id;
  end if;

  -- 2. Bootstrap User 1 (Rithvik)
  select id into v_user_1 from auth.users where email = 'rithvik@iith.ac.in';
  if v_user_1 is null then
    v_user_1 := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_1, 'authenticated', 'authenticated',
      'rithvik@iith.ac.in', v_encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rithvik Manne","display_name":"Rithvik"}'::jsonb,
      now(), now()
    );
  else
    update auth.users
    set encrypted_password = v_encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_1;
  end if;

  insert into public.profiles (id, team_id, full_name, display_name, role, current_streak, last_active_date)
  values (v_user_1, v_team_id, 'Rithvik Manne', 'Rithvik', 'Forward Deployed Engineer', 0, null)
  on conflict (id) do update set
    team_id = v_team_id,
    display_name = 'Rithvik',
    full_name = 'Rithvik Manne';

  -- 3. Bootstrap User 2 (Alex / Study Partner)
  select id into v_user_2 from auth.users where email = 'partner@fdeprep.io';
  if v_user_2 is null then
    v_user_2 := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_2, 'authenticated', 'authenticated',
      'partner@fdeprep.io', v_encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alex Rivera","display_name":"Alex (Partner)"}'::jsonb,
      now(), now()
    );
  else
    update auth.users
    set encrypted_password = v_encrypted_pw,
        email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_2;
  end if;

  insert into public.profiles (id, team_id, full_name, display_name, role, current_streak, last_active_date)
  values (v_user_2, v_team_id, 'Alex Rivera', 'Alex (Partner)', 'FDE Candidate', 0, null)
  on conflict (id) do update set
    team_id = v_team_id,
    display_name = 'Alex (Partner)',
    full_name = 'Alex Rivera';
end $$;

-- ============================================================================
-- 9. SEED 12-WEEK ROADMAP (CURRICULUM SPINE)
-- ============================================================================

do $$
declare
  v_team_id uuid;
begin
  select id into v_team_id from public.teams limit 1;

  insert into public.roadmap_weeks (
    team_id, week_number, phase_number, phase_title, title,
    learning_objectives, practical_task, joint_deliverable, notes
  )
  values
  -- PHASE 1: LLM INTEGRATION & RAG (Weeks 1-2)
  (
    v_team_id, 1, 1, 'LLM Integration and RAG',
    'Foundations: Structured Outputs, Streaming & Prompt Engineering',
    '[
      {"id": "w1-1", "text": "Master strict JSON schema / structured outputs and deterministic tool parameters", "completed_by": []},
      {"id": "w1-2", "text": "Implement token streaming, retry with exponential backoff, and fallback model routing", "completed_by": []},
      {"id": "w1-3", "text": "Track latency (TTFT, TPS) and token cost telemetry per request", "completed_by": []}
    ]'::jsonb,
    'Build a resilient LLM gateway wrapper supporting structured extraction over messy enterprise PDFs/JSON logs with latency logging.',
    'Working LLM ingestion service with strict Pydantic/Zod schema validation and fallback handling.',
    'Focus on production failure modes: rate limits, malformed JSON, and latency spikes.'
  ),
  (
    v_team_id, 2, 1, 'LLM Integration and RAG',
    'Production RAG: Chunking, Hybrid Search & Retrieval Evals',
    '[
      {"id": "w2-1", "text": "Understand embeddings, pgvector indexing (HNSW/IVFFlat), and vector similarity metrics", "completed_by": []},
      {"id": "w2-2", "text": "Implement semantic + keyword hybrid search (BM25 + dense embeddings) with metadata filtering", "completed_by": []},
      {"id": "w2-3", "text": "Build an automated retrieval evaluation harness measuring Recall@K and MRR", "completed_by": []}
    ]'::jsonb,
    'Index 1,000 messy enterprise documents with metadata ACLs and benchmark hybrid retrieval accuracy vs dense embeddings alone.',
    'Hybrid search API endpoint with Ragas/TruLens evaluation report demonstrating >85% Recall@5.',
    'Palantir FDE interviews heavily test how you handle broken data formats and out-of-domain jargon.'
  ),
  -- PHASE 2: AGENTS, TOOL CALLING & ONTOLOGY (Weeks 3-4)
  (
    v_team_id, 3, 2, 'Agents and Palantir Ontology',
    'Operational Agents: Tool Calling, State Machines & Memory',
    '[
      {"id": "w3-1", "text": "Architect multi-step reasoning loops with structured tool invocation and error recovery", "completed_by": []},
      {"id": "w3-2", "text": "Implement durable agent state machines (LangGraph / Temporal style) with Human-in-the-Loop gates", "completed_by": []},
      {"id": "w3-3", "text": "Prevent agent infinite loops, enforce token budgets, and capture full trace spans", "completed_by": []}
    ]'::jsonb,
    'Build an operational triaging agent that queries Postgres, calls external APIs, and generates verified refund actions.',
    'Deterministic agent workflow with schema-checked tool calls, loop breaker, and state persistence.',
    'Key interview question: How do you prevent an agent from taking destructive database actions?'
  ),
  (
    v_team_id, 4, 2, 'Agents and Palantir Ontology',
    'Palantir Foundry Core: The Semantic Object Ontology Layer',
    '[
      {"id": "w4-1", "text": "Deconstruct Palantir Foundry Ontology: Objects, Links, Actions, and Security Principals", "completed_by": []},
      {"id": "w4-2", "text": "Model messy multi-source data (ERP, CRM, logs) into a unified relational object graph", "completed_by": []},
      {"id": "w4-3", "text": "Map business workflows to kinetic actions with audit logging and rollback support", "completed_by": []}
    ]'::jsonb,
    'Design and write the relational schema for a Supply Chain Ontology tracking Orders, Suppliers, Shipments, and Disruption Actions.',
    'Full ontology data model with SQL migration, ERD diagram, and automated reconciliation pipeline.',
    'This is the heart of the Palantir FDE role: translating messy customer chaos into a kinetic operational graph.'
  ),
  -- PHASE 3: PRODUCTION INFRASTRUCTURE & SCALING (Weeks 5-6)
  (
    v_team_id, 5, 3, 'Production Infra and Systems',
    'Enterprise Data Pipelines: Ingestion, CDC & Reconciliation',
    '[
      {"id": "w5-1", "text": "Design batch vs streaming ingestion pipelines (Kafka, Debezium CDC, Airflow)", "completed_by": []},
      {"id": "w5-2", "text": "Handle dirty data: deduplication, schema evolution, missing identifiers, and merge conflicts", "completed_by": []},
      {"id": "w5-3", "text": "Build idempotent ingestion sinks that survive mid-stream worker crashes", "completed_by": []}
    ]'::jsonb,
    'Create an idempotent ingestion worker syncing 50k mock ERP events/min into Postgres with conflict resolution.',
    'Data pipeline test suite proving zero data loss across simulated network drops and worker restarts.',
    'FDEs spend 60% of their early deployment time dealing with customer ingestion pipelines and broken CSVs.'
  ),
  (
    v_team_id, 6, 3, 'Production Infra and Systems',
    'Model Serving, Inference Optimization & Reliability',
    '[
      {"id": "w6-1", "text": "Benchmark vLLM, Ollama, and TensorRT-LLM throughput vs latency trade-offs", "completed_by": []},
      {"id": "w6-2", "text": "Implement semantic response caching (Redis/pgvector) to cut LLM costs by 40%", "completed_by": []},
      {"id": "w6-3", "text": "Design an automated canary evaluation pipeline before routing production traffic to newer models", "completed_by": []}
    ]'::jsonb,
    'Set up self-hosted local LLM serving with vLLM or Ollama, adding a semantic cache layer with hit/miss metrics.',
    'Benchmarked inference gateway measuring p50/p95/p99 latency under 50 concurrent requests.',
    'Be ready to answer: When do you self-host vs use frontier API models in an enterprise setup?'
  ),
  -- PHASE 4: ENTERPRISE SECURITY & COMPLIANCE (Weeks 7-8)
  (
    v_team_id, 7, 4, 'Enterprise Security and Guardrails',
    'Security, Guardrails & LLM Red-Teaming',
    '[
      {"id": "w7-1", "text": "Mitigate prompt injection, jailbreaking, and indirect data poisoning", "completed_by": []},
      {"id": "w7-2", "text": "Implement input/output guardrails (NeMo / Llama Guard) with PII redaction (Presidio)", "completed_by": []},
      {"id": "w7-3", "text": "Red-team your own RAG application using automated adversarial probes", "completed_by": []}
    ]'::jsonb,
    'Build an adversarial attack harness testing prompt injection, system prompt extraction, and PII leakage.',
    'Security benchmark report with automated guardrails blocking >95% of injection attempts with <50ms overhead.',
    'Palantir works heavily with defense, intelligence, and healthcare—security is non-negotiable.'
  ),
  (
    v_team_id, 8, 4, 'Enterprise Security and Guardrails',
    'Multi-Tenancy, Enterprise RBAC & Document ACLs',
    '[
      {"id": "w8-1", "text": "Design row-level security (RLS) and document-level ACL filtering in vector databases", "completed_by": []},
      {"id": "w8-2", "text": "Enforce strict tenant data isolation across compute, vector indexes, and object storage", "completed_by": []},
      {"id": "w8-3", "text": "Implement audit-ready logging compliance (SOC2 / HIPAA / FedRAMP requirements)", "completed_by": []}
    ]'::jsonb,
    'Implement multi-tenant RAG querying where user permissions filter vector chunks at query execution time.',
    'Integration test suite proving User A can never retrieve User B documents even with identical embeddings.',
    'Crucial question: Why does prompt-level access control fail, and how do you enforce ACLs in the index?'
  ),
  -- PHASE 5: EVALUATION, OBSERVABILITY & METRICS (Weeks 9-10)
  (
    v_team_id, 9, 5, 'Evals and Observability',
    'Comprehensive Evals: Offline Benchmarks & Online Telemetry',
    '[
      {"id": "w9-1", "text": "Set up end-to-end evaluation with Ragas / DeepEval (Faithfulness, Relevance, Groundedness)", "completed_by": []},
      {"id": "w9-2", "text": "Instrument full OpenTelemetry / Langfuse distributed tracing for every LLM and tool step", "completed_by": []},
      {"id": "w9-3", "text": "Build regression test suites that run in CI/CD before any prompt or retrieval change is merged", "completed_by": []}
    ]'::jsonb,
    'Instrument the flagship project with Langfuse or Arize Phoenix, capturing full execution trace spans.',
    'Automated CI/CD evaluation gate that blocks PRs if Faithfulness drops below 0.90.',
    'Top AI startup interview question: How do you prove to an enterprise client that your v2 model is actually better?'
  ),
  (
    v_team_id, 10, 5, 'Evals and Observability',
    'Production Operations: Latency Triage, Cost & Incident Postmortems',
    '[
      {"id": "w10-1", "text": "Triage live production degradation: latency spikes, 429 backoff storms, and context window bloat", "completed_by": []},
      {"id": "w10-2", "text": "Optimize token costs: context pruning, smaller model routing, and output token limits", "completed_by": []},
      {"id": "w10-3", "text": "Write a blameless postmortem for a high-severity customer-facing AI incident", "completed_by": []}
    ]'::jsonb,
    'Simulate a live outage (500 errors from LLM provider) and implement automated circuit breakers and fallbacks.',
    'Production incident response runbook and completed postmortem with root cause analysis.',
    'In FDE interviews, you are tested on how you keep your head cool during live enterprise outages.'
  ),
  -- PHASE 6: INTERVIEW DRILLS, DECOMPOSITION & CAPSTONE (Weeks 11-12)
  (
    v_team_id, 11, 6, 'Interview Drills and Capstone',
    'Palantir FDE Decomposition & Customer Scenario Drills',
    '[
      {"id": "w11-1", "text": "Master Palantir Decomposition rounds: break down ambiguous client problems into technical systems", "completed_by": []},
      {"id": "w11-2", "text": "Practice on-site customer discovery roleplay: push back on bad requirements, discover true KPIs", "completed_by": []},
      {"id": "w11-3", "text": "Scope a 1-week MVP vs 3-month enterprise deployment with realistic resource allocation", "completed_by": []}
    ]'::jsonb,
    'Execute 4 live mock decomposition rounds (Hospital Bed Management, Fraud Ring Detection, Factory QC, Logistics).',
    'Scored mock interview recordings with structured rubrics and peer critique logs.',
    'Decomposition is the #1 filter round at Palantir. They look for clarity, problem ownership, and pragmatism.'
  ),
  (
    v_team_id, 12, 6, 'Interview Drills and Capstone',
    'AI Startup System Design & Flagship Portfolio Capstone',
    '[
      {"id": "w12-1", "text": "Defend the flagship capstone architecture under intense technical cross-examination", "completed_by": []},
      {"id": "w12-2", "text": "Practice end-to-end AI System Design: Multi-Modal RAG, Code-Gen Agent, Real-Time Voice Copilot", "completed_by": []},
      {"id": "w12-3", "text": "Refine technical storytelling: connect code changes to enterprise business value and ROI", "completed_by": []}
    ]'::jsonb,
    'Final capstone polish, live demo recording, GitHub README with architecture diagrams, and mock interview gauntlet.',
    'Production-ready FDE Flagship repository with live deployment and verified evaluation scorecard.',
    'You are now interview-ready for Palantir Forward Deployed Engineer and Tier-1 AI Startup engineering roles.'
  )
  on conflict (team_id, week_number) do update set
    phase_title = excluded.phase_title,
    title = excluded.title,
    learning_objectives = excluded.learning_objectives,
    practical_task = excluded.practical_task,
    joint_deliverable = excluded.joint_deliverable,
    notes = excluded.notes;
end $$;

-- ============================================================================
-- 10. SEED FLAGSHIP PROJECT, RESOURCES & TASKS (PHASE 3)
-- ============================================================================

do $$
declare
  v_team_id uuid;
  v_project_id uuid;
  v_user_1 uuid;
  v_user_2 uuid;
  v_w1 uuid;
  v_w2 uuid;
  v_w3 uuid;
  v_w4 uuid;
  v_w5 uuid;
  v_w6 uuid;
  v_w7 uuid;
  v_w8 uuid;
  v_w9 uuid;
  v_w10 uuid;
  v_w11 uuid;
  v_w12 uuid;
begin
  select id into v_team_id from public.teams limit 1;
  select id into v_user_1 from public.profiles where team_id = v_team_id order by created_at asc limit 1;
  select id into v_user_2 from public.profiles where team_id = v_team_id order by created_at desc limit 1;

  select id into v_w1 from public.roadmap_weeks where team_id = v_team_id and week_number = 1;
  select id into v_w2 from public.roadmap_weeks where team_id = v_team_id and week_number = 2;
  select id into v_w3 from public.roadmap_weeks where team_id = v_team_id and week_number = 3;
  select id into v_w4 from public.roadmap_weeks where team_id = v_team_id and week_number = 4;
  select id into v_w5 from public.roadmap_weeks where team_id = v_team_id and week_number = 5;
  select id into v_w6 from public.roadmap_weeks where team_id = v_team_id and week_number = 6;
  select id into v_w7 from public.roadmap_weeks where team_id = v_team_id and week_number = 7;
  select id into v_w8 from public.roadmap_weeks where team_id = v_team_id and week_number = 8;
  select id into v_w9 from public.roadmap_weeks where team_id = v_team_id and week_number = 9;
  select id into v_w10 from public.roadmap_weeks where team_id = v_team_id and week_number = 10;
  select id into v_w11 from public.roadmap_weeks where team_id = v_team_id and week_number = 11;
  select id into v_w12 from public.roadmap_weeks where team_id = v_team_id and week_number = 12;

  -- 1. Flagship Project
  select id into v_project_id from public.projects
  where team_id = v_team_id and name = 'AegisOps: Enterprise AI Operations & Ontology Engine' limit 1;

  if v_project_id is null then
    insert into public.projects (team_id, name, description, repo_url, status)
    values (
      v_team_id,
      'AegisOps: Enterprise AI Operations & Ontology Engine',
      'Flagship FDE capstone combining messy ERP ingestion, pgvector hybrid retrieval, ACL security enforcement, and tool-calling operational agents.',
      'https://github.com/your-org/aegis-ops-fde',
      'active'
    )
    returning id into v_project_id;
  end if;

  -- 2. Curated Curriculum Resources (36 Comprehensive Resources Across 5 Phases + Textbooks)
  delete from public.resources where team_id = v_team_id;

  insert into public.resources (
    team_id, week_id, title, url, category, resource_type,
    priority, difficulty, is_free, why_studying
  )
  values
  -- PHASE 1: CORE COMPUTER SCIENCE & FOUNDATIONS
  (
    v_team_id, v_w1,
    'Full HTTP Networking Course – Fetch and REST APIs in JavaScript',
    'https://youtu.be/2JYT5f2isg4',
    'Foundations', 'YouTube', 'critical', 'easy', true,
    'HTTP/1.1 vs HTTP/2, Request/Response anatomy, Status Codes (2xx, 3xx, 4xx, 5xx), Headers, Cookies, CORS, Preflight requests, Fetch API, and REST constraints.'
  ),
  (
    v_team_id, v_w1,
    'Git and GitHub - Full Course',
    'https://youtu.be/rH3zE7VlIMs',
    'Cloud & DevOps', 'YouTube', 'critical', 'easy', true,
    'Working tree, Staging area, Git history/DAG, Branching, Merging vs Rebasing, Cherry-picking, Conflict resolution, Remote remotes, PR workflows, and Git Hooks.'
  ),
  (
    v_team_id, v_w11,
    '70 LeetCode Problems in 5+ Hours',
    'https://youtu.be/lvO88XxNAzs',
    'Foundations', 'YouTube', 'high', 'medium', true,
    'Top patterns: Two Pointers, Sliding Window, Monotonic Stack, Fast/Slow Pointers, Binary Search, Tree traversals (BFS/DFS), Dynamic Programming, and Graph algorithms.'
  ),
  (
    v_team_id, v_w11,
    'Data Structures and Algorithms Full Course',
    'https://youtu.be/CBYHwZcbD-s',
    'Foundations', 'YouTube', 'critical', 'medium', true,
    'Asymptotic complexity (O(1) to O(2^n)), Arrays, Linked Lists, Hash Tables, Trees (BST, AVL, Segment Trees), Heaps, Graphs (Dijkstra, Topological Sort), and Greedy algorithms.'
  ),
  (
    v_team_id, v_w1,
    'Introduction to Linux – Full Course for Beginners',
    'https://youtu.be/sWbUDq4S6Y8',
    'Foundations', 'YouTube', 'high', 'easy', true,
    'Unix philosophy, File Hierarchy System (FHS), Permissions (chmod, chown), Process management (ps, kill, systemd), Pipelines (grep, sed, awk, find), Shell scripting, and I/O redirection.'
  ),
  (
    v_team_id, v_w4,
    'Object Oriented Design & Low-Level Design (LLD)',
    'https://refactoring.guru/design-patterns',
    'System Design', 'Course', 'critical', 'medium', true,
    'SOLID principles, Gang of Four (GoF) design patterns (Factory, Strategy, Observer, Singleton, Decorator), UML diagrams, and Class modeling.'
  ),
  (
    v_team_id, v_w5,
    'DevOps from Zero to Hero (Docker & Production Delivery)',
    'https://youtu.be/H5FAxTBuNM8',
    'Cloud & DevOps', 'YouTube', 'critical', 'medium', true,
    'Containerization internals (Namespaces, cgroups), Dockerfiles, Multi-stage builds, Docker Compose, CI/CD automated deployment pipelines, and Production API delivery.'
  ),
  (
    v_team_id, v_w2,
    'PostgreSQL Tutorial Full Course',
    'https://youtu.be/85pG_pDkITY',
    'Databases', 'YouTube', 'critical', 'medium', true,
    'Relational schema design, Normalization (1NF–3NF), Keys, Joins (INNER, LEFT, CROSS), Aggregations, Window Functions, PL/pgSQL Functions, Triggers, and Cursors.'
  ),

  -- PHASE 2: GENERATIVE AI, RAG & AGENTS
  (
    v_team_id, v_w1,
    'Generative AI for Developers – Comprehensive Course',
    'https://youtu.be/F0GQ0l2NfHA',
    'Applied AI', 'YouTube', 'critical', 'medium', true,
    'Foundation Models, Transformers architecture (Self-Attention, Encoders/Decoders), Tokenization, Context windows, Temperature/Top-P sampling, and Prompt engineering.'
  ),
  (
    v_team_id, v_w2,
    'Learn RAG From Scratch – Python AI Tutorial',
    'https://youtu.be/sVcwVQRHIc8',
    'Applied AI', 'YouTube', 'critical', 'medium', true,
    'Naive RAG pipeline: Document loading, Text chunking strategies (Fixed, Semantic), Embedding models, Cosine similarity search, and Context injection.'
  ),
  (
    v_team_id, v_w2,
    'Production RAG with LangChain & Vector Databases',
    'https://youtu.be/mHxLXzYjQRE',
    'Applied AI', 'YouTube', 'critical', 'hard', true,
    'Advanced retrieval: Re-ranking (Cross-Encoders), Hybrid Search (Dense + Sparse/BM25), Query transformation (HyDE, Sub-queries), Parent-Child Chunking, and Evaluation (RAGAS).'
  ),
  (
    v_team_id, v_w3,
    'Agentic AI – Complete Course for Beginners',
    'https://youtu.be/Zy7EXDONlTY',
    'Agents', 'YouTube', 'critical', 'hard', true,
    'Autonomous LLM agents, ReAct prompting pattern, Tool calling/Function execution, Memory management (Short vs Long term), Multi-agent collaboration frameworks (LangGraph, CrewAI).'
  ),

  -- PHASE 3: BACKEND ARCHITECTURE, APIS & SYSTEM DESIGN
  (
    v_team_id, v_w5,
    'API Design and Architecture - Backend Engineering Intro (1 Hour)',
    'https://youtu.be/XvFmUE-36Kc',
    'Backend & APIs', 'YouTube', 'high', 'easy', true,
    'Idempotency, Resource naming conventions, Pagination strategies (Cursor vs Offset), Error responses (RFC 7807), Rate limiting (Token Bucket, Leaky Bucket), API Gateways, OAuth2/JWT.'
  ),
  (
    v_team_id, v_w5,
    'How to Design APIs Like a Senior Engineer (REST, GraphQL, Auth, Security)',
    'https://youtu.be/7iHl71nt49o',
    'Backend & APIs', 'YouTube', 'critical', 'medium', true,
    'Enterprise API architecture, REST vs GraphQL tradeoffs, Authentication mechanisms, and API security best practices.'
  ),
  (
    v_team_id, v_w6,
    'System Design Playlist (Gaurav Sen)',
    'https://youtube.com/playlist?list=PLinedj3B30sBlBWRox2V2tg9QJ2zr4M3o&si=mE6-IiGCMQ-JNARz',
    'System Design', 'Playlist', 'critical', 'hard', true,
    'Scalability patterns, Load Balancers, Horizontal vs Vertical scaling, Microservices, CAP Theorem, Consistent Hashing, Message Brokers, Distributed Caching.'
  ),
  (
    v_team_id, v_w12,
    'System Design Interview Playlist (SudoCODE)',
    'https://youtube.com/playlist?list=PLdNCznBZ77NqqZMrLPRb1RLm7LObOCb21&si=hpuJW1D-0pA0bSA9',
    'System Design', 'Playlist', 'critical', 'hard', true,
    'End-to-end interview blueprints: Designing URL Shorteners, WhatsApp/Chat architectures, Netflix/YouTube video streaming pipelines, and Uber ride-matching systems.'
  ),
  (
    v_team_id, v_w5,
    'Chai aur JavaScript Backend (Production Node.js & Express)',
    'https://youtube.com/playlist?list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW&si=YmiRG-Nluc13WenI',
    'Backend & APIs', 'Playlist', 'high', 'medium', true,
    'Production Express/Node.js setup, Mongoose schemas, Custom API error wrappers, File uploads with Multer & Cloudinary, Access/Refresh JWT auth, and aggregation pipelines.'
  ),
  (
    v_team_id, v_w1,
    'FastAPI Full Course: Build & Deploy a Real API',
    'https://youtu.be/pGQfWLN2tMY',
    'Backend & APIs', 'YouTube', 'critical', 'medium', true,
    'Asynchronous endpoints (async/await), Pydantic validation, SQLAlchemy/PostgreSQL ORM integration, Dependency Injection, and Dockerized production deployments.'
  ),
  (
    v_team_id, v_w6,
    'Real-Time WebSockets Course (Live Sports Dashboard)',
    'https://youtu.be/pbOXOY78dNA',
    'Backend & APIs', 'YouTube', 'high', 'medium', true,
    'Full-duplex bidirectional communication, WebSocket handshake, Fallbacks, Connection pooling, Broadcasting events, and syncing state with PostgreSQL.'
  ),

  -- PHASE 4: ADVANCED DATA STORES, CACHING & MESSAGE QUEUES
  (
    v_team_id, v_w5,
    'MongoDB FULL Course (Monster Class)',
    'https://youtu.be/GPwmvKYClUs',
    'Databases', 'YouTube', 'high', 'medium', true,
    'Document data modeling, BSON structure, CRUD operations, Indexing (compound, text, geospatial), Aggregation Framework pipelines, and replica sets.'
  ),
  (
    v_team_id, v_w4,
    'Advanced SQL Playlist (TechTFQ)',
    'https://youtube.com/playlist?list=PLavw5C92dz9GbmgiW4TWVnxhjMFOIf0Q7&si=mE969XOBxMa0WCni',
    'Databases', 'Playlist', 'critical', 'hard', true,
    'Complex Window functions (ROW_NUMBER, DENSE_RANK, LEAD, LAG), Common Table Expressions (CTEs), Recursive queries, Query execution plans (EXPLAIN ANALYZE), and Performance tuning.'
  ),
  (
    v_team_id, v_w2,
    'Vector Databases Full Course | Zero to Advanced',
    'https://youtu.be/AgmC_IaqQ2A',
    'Applied AI', 'YouTube', 'critical', 'hard', true,
    'Vector embeddings, High-dimensional vector search algorithms (HNSW, IVF-Flat), Approximate Nearest Neighbors (ANN), Filtering, and Database setups (Pinecone, Chroma, Qdrant, pgvector).'
  ),
  (
    v_team_id, v_w6,
    'Redis Crash Course',
    'https://youtu.be/Vx2zPMPvmug',
    'Databases', 'YouTube', 'high', 'medium', true,
    'In-memory key-value architecture, Data types (Strings, Lists, Sets, Hashes, Sorted Sets), Expiration/TTL policies, and Cache eviction strategies (LRU, LFU).'
  ),
  (
    v_team_id, v_w6,
    'Complete Redis, WebSockets, Pub/Subs & Message Queues',
    'https://youtu.be/IJkYipYNEtI',
    'Backend & APIs', 'YouTube', 'critical', 'hard', true,
    'Redis as a distributed cache, Session storage, Redis Streams, Pub/Sub event broadcasting, and Asynchronous job queues (BullMQ/Celery).'
  ),

  -- PHASE 5: CLOUD INFRASTRUCTURE & ADVANCED DEVOPS
  (
    v_team_id, v_w7,
    'IT Fundamentals & Infrastructure Course',
    'https://youtu.be/4m9j6hlbf4g',
    'Cloud & DevOps', 'YouTube', 'medium', 'easy', true,
    'Hardware layers, Operating Systems, Networking, DNS resolution paths, Subnetting, Security fundamentals, and Enterprise infrastructure layout.'
  ),
  (
    v_team_id, v_w10,
    'Master Full-Stack Docker & CI/CD – Production Pipeline',
    'https://youtu.be/lEcULR30-GM',
    'Cloud & DevOps', 'YouTube', 'critical', 'hard', true,
    'Continuous Integration / Continuous Deployment workflows, GitHub Actions/GitLab CI, Automated testing, Linting, Building multi-stage Docker images, and CD to cloud instances.'
  ),
  (
    v_team_id, v_w7,
    'Computer Networking Fundamentals Course',
    'https://youtu.be/fQbBPa0ADvs',
    'Cloud & DevOps', 'YouTube', 'critical', 'medium', true,
    'OSI 7-Layer model, TCP/IP stack, TCP 3-way handshake, Flow/Congestion control, UDP, DNS, TLS 1.3 handshake, HTTP/3 (QUIC), and NAT traversal.'
  ),
  (
    v_team_id, v_w10,
    'AWS Tutorial For Beginners (AWS Data Engineer)',
    'https://youtu.be/Ae3xyW2Ef0c',
    'Cloud & DevOps', 'YouTube', 'critical', 'medium', true,
    'Core AWS primitives: Compute (EC2, Lambda), Storage (S3, EBS), Networking (VPC, Subnets, Route Tables, Security Groups), Databases (RDS, DynamoDB), and IAM security policies.'
  ),

  -- REFERENCE TEXTBOOKS & DRIVE LINKS
  (
    v_team_id, v_w2,
    'AI Engineering (Chip Huyen)',
    'https://drive.google.com/file/d/1izYCLklMi-AeHyUqqhzFUb2tekT87YKn/view?usp=drive_link',
    'Books', 'Book', 'critical', 'hard', true,
    'Foundation model training, inference optimization, RAG engineering, prompt workflows, fine-tuning, evaluation, and production deployment patterns.'
  ),
  (
    v_team_id, v_w8,
    'Cloud Computing Concepts, Technology & Architecture (Thomas Erl et al.)',
    'https://drive.google.com/file/d/1UVoJpeSVjNwEmrg1av0LauiZoSJSYHpa/view?usp=drive_link',
    'Books', 'Book', 'high', 'medium', true,
    'Cloud delivery models (IaaS, PaaS, SaaS), virtualization architectures, multitenancy, cloud storage mechanics, and elastic scaling systems.'
  ),
  (
    v_team_id, v_w4,
    'Database System Concepts (Silberschatz, Korth, Sudarshan)',
    'https://drive.google.com/file/d/1f0JZCEzC0xxscBTBe7HU38VaAh5ObJGl/view?usp=drive_link',
    'Books', 'Book', 'critical', 'hard', true,
    'Relational algebra, storage engines, B+ Trees, hashing indices, ACID transaction management, concurrency control (2PL, MVCC), and crash recovery (WAL).'
  ),
  (
    v_team_id, v_w5,
    'Designing Data-Intensive Applications (DDIA - Martin Kleppmann)',
    'https://drive.google.com/file/d/1NA6K0CTZjP2xFN0NshM0FkhkI_QdqoMu/view?usp=drive_link',
    'Books', 'Book', 'critical', 'hard', true,
    'The gold standard for distributed systems—covering data encoding, replication (single-leader, multi-leader, leaderless), partitioning, consensus (Raft/Paxos), and batch/stream processing.'
  ),
  (
    v_team_id, v_w11,
    'Introduction to Algorithms (CLRS - Cormen, Leiserson, Rivest, Stein)',
    'https://drive.google.com/file/d/1cbstYlz9Ig_PWdfXrVzrrOCg2x4CGqxZ/view?usp=drive_link',
    'Books', 'Book', 'critical', 'hard', true,
    'Rigorous mathematical foundations of algorithms, divide-and-conquer, dynamic programming, graph theory, NP-completeness, and advanced data structures (Fibonacci Heaps, Van Emde Boas).'
  ),
  (
    v_team_id, v_w9,
    'LLM Engineer’s Handbook (Paul Iusztin et al.)',
    'https://drive.google.com/file/d/1XRIwXA12WEnkeMePJnrlXuCisa1l1qq3/view?usp=drive_link',
    'Books', 'Book', 'critical', 'hard', true,
    'Practical LLM development: quantization (GGUF, AWQ), parameter-efficient fine-tuning (LoRA, QLoRA), context extension, synthetic data generation, and LLMOps.'
  ),
  (
    v_team_id, v_w10,
    'The DevOps Handbook (Gene Kim et al.)',
    'https://drive.google.com/file/d/1J_tF5HRZTN1nuJHVCWJarlhN5aCY153t/view?usp=drive_link',
    'Books', 'Book', 'high', 'medium', true,
    'The Three Ways (Flow, Feedback, Continual Learning), telemetry, automated testing, continuous integration, blue-green/canary deployments, and resilient engineering culture.'
  ),
  (
    v_team_id, v_w1,
    'The Linux Command Line (William Shotts)',
    'https://drive.google.com/file/d/1A8jULEzUDMlgLLI0x1M3bTkAQ4wSzD4F/view?usp=drive_link',
    'Books', 'Book', 'high', 'easy', true,
    'Comprehensive terminal mastery, standard streams, shell expansion, vi/vim, file compilation, package managers, and automated bash scripting.'
  );

  -- 3. Initial Tasks with Definition of Done (DoD)
  delete from public.tasks where team_id = v_team_id and title in (
    'Build resilient LLM gateway with structured output parsing',
    'Implement token streaming and exponential backoff retry loop',
    'Ingest 1,000 messy enterprise PDFs & chunk into pgvector',
    'Implement Reciprocal Rank Fusion hybrid search (BM25 + Dense)',
    'Design Supply Chain Ontology schema (Orders, Shipments, Nodes)'
  );

  insert into public.tasks (
    team_id, week_id, project_id, owner_id, title, description,
    status, priority, due_date, definition_of_done
  )
  values
  (
    v_team_id, v_w1, v_project_id, v_user_1,
    'Build resilient LLM gateway with structured output parsing',
    'Implement strict Zod/Pydantic schema validation over raw JSON strings returned by frontier models with fallback repair.',
    'backlog', 'critical', current_date + interval '3 days',
    '[
      {"id": "d1", "label": "Validates schema against strict Zod type", "checked": false},
      {"id": "d2", "label": "Unit tests pass with malformed JSON fixtures", "checked": false},
      {"id": "d3", "label": "Latency and token counts logged to stdout", "checked": false},
      {"id": "d4", "label": "Peer reviewed by squad teammate", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w1, v_project_id, v_user_2,
    'Implement token streaming and exponential backoff retry loop',
    'Ensure client UI displays instantaneous TTFT (<400ms) with jittered retry on 429 and 503 upstream errors.',
    'backlog', 'high', current_date + interval '4 days',
    '[
      {"id": "d1", "label": "Token streaming tested on Next.js Server Actions", "checked": false},
      {"id": "d2", "label": "Exponential backoff tested with mock 429 gateway", "checked": false},
      {"id": "d3", "label": "Jitter prevents thundering herd problem", "checked": false},
      {"id": "d4", "label": "Code merged into main via PR", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w2, v_project_id, v_user_1,
    'Ingest 1,000 messy enterprise PDFs & chunk into pgvector',
    'Benchmark recursive character chunking vs markdown-aware semantic chunking on messy PDF tables.',
    'backlog', 'critical', current_date + interval '7 days',
    '[
      {"id": "d1", "label": "PDF parser extracts tables without breaking rows", "checked": false},
      {"id": "d2", "label": "HNSW index built with m=16, ef_construction=64", "checked": false},
      {"id": "d3", "label": "p95 retrieval latency under 80ms on 10k vectors", "checked": false},
      {"id": "d4", "label": "Metadata ACL permissions attached to each chunk", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w2, v_project_id, v_user_2,
    'Implement Reciprocal Rank Fusion hybrid search (BM25 + Dense)',
    'Combine Postgres full-text tsvector search with pgvector cosine distance to catch exact part numbers and acronyms.',
    'backlog', 'high', current_date + interval '8 days',
    '[
      {"id": "d1", "label": "SQL query performs single-pass hybrid rank fusion", "checked": false},
      {"id": "d2", "label": "Reciprocal Rank Fusion k parameter tuned to 60", "checked": false},
      {"id": "d3", "label": "Recall@5 benchmarked at >85% on financial query test set", "checked": false},
      {"id": "d4", "label": "Documentation added to capstone repo README", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w3, v_project_id, v_user_1,
    'Design Supply Chain Ontology schema (Orders, Shipments, Nodes)',
    'Create relational schema modeling objects, links, and kinetic actions (RerouteShipment, EscalateDelay).',
    'backlog', 'medium', current_date + interval '12 days',
    '[
      {"id": "d1", "label": "ERD diagram reviewed and signed off", "checked": false},
      {"id": "d2", "label": "SQL migration script created with foreign keys", "checked": false},
      {"id": "d3", "label": "Audit log trigger captures before/after action states", "checked": false},
      {"id": "d4", "label": "RLS policies enforce tenant boundary", "checked": false}
    ]'::jsonb
  );
end $$;

-- ============================================================================
-- 11. SEED PALANTIR & AI STARTUP QUESTIONS + ADR LOG (PHASE 5)
-- ============================================================================

do $$
declare
  v_team_id uuid;
  v_project_id uuid;
  v_user_1 uuid;
  v_user_2 uuid;
begin
  select id into v_team_id from public.teams limit 1;
  select id into v_project_id from public.projects where team_id = v_team_id limit 1;
  select id into v_user_1 from public.profiles where team_id = v_team_id order by created_at asc limit 1;
  select id into v_user_2 from public.profiles where team_id = v_team_id order by created_at desc limit 1;

  -- 1. Interview Questions Bank
  delete from public.interview_questions where team_id = v_team_id and topic in (
    'RAG Debugging & Evals', 'Agents & Tool Calling', 'Production Incident & Latency',
    'Enterprise Security & ACLs', 'Decomposition & System Design', 'Customer Discovery Scenario',
    'System Design & Data Pipelines', 'Behavioral & Ownership'
  );

  insert into public.interview_questions (
    team_id, track, topic, difficulty, question_text, review_checklist
  )
  values
  -- TRACK B: AI STARTUPS
  (
    v_team_id, 'ai_startup', 'RAG Debugging & Evals', 'hard',
    'A customer reports that our production RAG application is returning confident but factually wrong answers on 15% of queries over their financial contracts. Walk through how you diagnose, measure, and fix this.',
    '[
      "Did you separate retrieval failures (wrong chunks fetched) from generation failures (hallucination over valid chunks)?",
      "Did you inspect raw ingested text for broken PDF tables, bad OCR, or boundary-splitting chunk sizes?",
      "Did you check whether keyword/exact-match terms (contract IDs, dates, clauses) require Hybrid Search (BM25 + dense embeddings)?",
      "Did you propose a quantitative evaluation metric (Recall@K, Context Precision, Faithfulness) before changing prompts?",
      "Did you add the failing queries into a permanent regression test dataset?"
    ]'::jsonb
  ),
  (
    v_team_id, 'ai_startup', 'Agents & Tool Calling', 'hard',
    'We need an AI agent that can inspect customer support tickets, query our production Postgres database, and issue refunds via Stripe. How do you architect this safely so it never corrupts data or enters an infinite loop?',
    '[
      "Did you separate read-only diagnostic tools (SELECT queries with read-only DB credentials) from mutating tools?",
      "Did you enforce a strict step/token budget and loop detection on the agent state machine?",
      "Did you require a Human-in-the-Loop (HITL) approval gate or deterministic policy check before executing Stripe refunds above a threshold?",
      "Did you validate tool arguments with strict schemas (Zod/Pydantic) and return structured error strings to the model?",
      "Did you log full execution traces and idempotency keys for every tool invocation?"
    ]'::jsonb
  ),
  (
    v_team_id, 'ai_startup', 'Production Incident & Latency', 'medium',
    'During a live enterprise pilot, p95 response latency on your AI copilot jumps from 1.8s to 14s and token costs 5x overnight. How do you triage this in the first 30 minutes?',
    '[
      "Did you break down latency into Time-To-First-Token (TTFT), retrieval DB latency, reranker latency, and token generation length?",
      "Did you check if prompt context windows bloated due to unbounded chat history or retrieving too many large chunks?",
      "Did you check upstream LLM provider status / rate-limit retries (429 backoff storms)?",
      "Did you propose immediate mitigations (semantic caching, smaller/faster router model, capping max_tokens)?"
    ]'::jsonb
  ),
  (
    v_team_id, 'ai_startup', 'Enterprise Security & ACLs', 'hard',
    'An enterprise customer wants to index 500,000 internal Google Drive and Slack documents into your RAG system, but employees must NEVER see answers derived from documents they do not have permission to view. How do you design this?',
    '[
      "Did you explain why prompt-level filtering fails and why permissions must be enforced as pre-filters in the vector database query?",
      "Did you model user/group principals as metadata arrays or join tables in Postgres/pgvector?",
      "Did you address how ACL changes (permission revocation) sync incrementally without re-embedding the entire document?",
      "Did you verify that citations and source snippets also respect the caller''s auth token?"
    ]'::jsonb
  ),
  -- TRACK A: PALANTIR
  (
    v_team_id, 'palantir', 'Decomposition & System Design', 'hard',
    'A regional hospital network says ER wait times have increased 40% and bed handoffs between departments are chaotic. They have 4 legacy databases (Epic EHR, nurse scheduling CSVs, bed cleaning logs, ambulance dispatch). How do you decompose this problem and what do you build in Week 1?',
    '[
      "Did you ask clarifying questions to identify the true bottleneck (e.g., bed cleaning turnaround vs. discharge sign-off) before designing software?",
      "Did you define a clean Ontology (Objects: Patient, Bed, Staff, Encounter; Links & Actions: AssignBed, MarkCleaned)?",
      "Did you scope a concrete, high-leverage Week-1 operational workflow for a single persona (e.g., Charge Nurse triage board) rather than boiling the ocean?",
      "Did you handle dirty/conflicting identifiers across the 4 source systems via an ingestion/reconciliation pipeline?",
      "Did you define a measurable operational KPI (e.g., reduce bed-dirty-to-clean lag by 20 minutes)?"
    ]'::jsonb
  ),
  (
    v_team_id, 'palantir', 'Customer Discovery Scenario', 'medium',
    'You are deployed on-site at a manufacturing plant. The VP of Supply Chain bought your platform, but the floor managers refuse to use your new dashboard and keep using their local Excel spreadsheets. What do you do?',
    '[
      "Did you shadow a floor manager at their desk to observe what their Excel sheet does in 2 clicks that your tool makes painful?",
      "Did you avoid blaming the user and instead identify missing data trust, latency, or workflow friction?",
      "Did you build a fast bridge (e.g., 1-click Excel export/import or automating their most hated 2-hour daily report) to earn immediate trust?",
      "Did you align the floor manager''s daily incentives with the VP''s high-level visibility goals?"
    ]'::jsonb
  ),
  (
    v_team_id, 'palantir', 'System Design & Data Pipelines', 'hard',
    'Design a multi-tenant operational alerting platform that ingests 50,000 IoT sensor events/sec from aircraft engines, joins them against maintenance schedules, and triggers deterministic + AI-assisted anomaly workflows within 3 seconds.',
    '[
      "Did you separate the hot stream-processing path (Kafka + Flink/Rust consumer) from the cold analytical storage path?",
      "Did you explain how reference data (maintenance schedules) is cached or broadcast-joined in memory for sub-second lookup?",
      "Did you address deduplication, out-of-order timestamps, and backpressure when a downstream service slows down?",
      "Did you keep the LLM out of the 50k/sec hot loop, triggering AI root-cause synthesis only after deterministic threshold rules fire?"
    ]'::jsonb
  ),
  (
    v_team_id, 'palantir', 'Behavioral & Ownership', 'medium',
    'Tell me about a time you had to ship a critical system under an aggressive deadline where requirements were ambiguous or changed midway. What technical trade-offs did you make, and what would you rewrite today?',
    '[
      "Did you state the concrete engineering stakes and timeline clearly in the first 30 seconds?",
      "Did you articulate a specific architectural trade-off (what you intentionally cut vs. what you protected)?",
      "Did you focus on your personal engineering ownership rather than hiding behind ''we''?",
      "Did you name a concrete flaw in your v1 design and the exact trigger condition that would require re-architecting it?"
    ]'::jsonb
  );

  -- 2. Sample Architecture Decision Record (ADR-001)
  delete from public.decisions where team_id = v_team_id and title like 'ADR-001%';
  insert into public.decisions (
    team_id, project_id, author_id, title,
    alternatives_considered, rationale, tradeoffs, reconsider_conditions
  )
  values (
    v_team_id, v_project_id, v_user_1,
    'ADR-001: Use PostgreSQL + pgvector with HNSW over a dedicated external Vector DB',
    '1. Pinecone (Managed Serverless Vector DB)' || chr(10) || '2. Qdrant (Self-hosted Docker container)' || chr(10) || '3. PostgreSQL with pgvector + tsvector (Supabase)',
    'Keeping relational ontology tables, user RBAC/ACL permissions, BM25 full-text indexes, and 1536-dim embeddings inside a single PostgreSQL instance lets us enforce document-level security via transactional SQL joins and RLS without dual-write synchronization bugs.',
    'Memory pressure on the primary Postgres instance if embeddings exceed ~2M vectors; slightly higher tuning effort for HNSW m/ef_construction parameters compared to managed Pinecone.',
    'Reconsider and split vector storage to Qdrant/Turbopuffer if chunk count exceeds 5 million rows, p95 retrieval latency exceeds 120ms after HNSW tuning, or vector index rebuilds starve OLTP write throughput.'
  );

  -- 3. Sample Weekly Retrospective Note
  delete from public.notes where team_id = v_team_id and title = 'Week 1 Retrospective & Sprint Alignment';
  insert into public.notes (
    team_id, author_id, title, content, is_shared, note_type
  )
  values (
    v_team_id, v_user_1,
    'Week 1 Retrospective & Sprint Alignment',
    E'### What We Shipped\n- FDE Prep Hub v1 live on Vercel + Supabase with RLS.\n- Structured output LLM gateway with Zod schema enforcement.\n\n### Where We Struggled\n- Naive fixed-size token chunking split markdown tables in half during initial PDF tests.\n\n### What Changes in Week 2\n- Switch to markdown-header-aware semantic chunking and benchmark Recall@5 before touching the UI.',
    true, 'retrospective'
  );

  -- 4. Mock Interviews start clean (0 scheduled/completed)
  delete from public.mock_interviews where team_id = v_team_id;
end $$;
