-- ============================================================================
-- FDE PREP HUB: PHASE 3 SEED (FLAGSHIP PROJECT, CURATED RESOURCES & TASKS)
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
  v_w5 uuid;
  v_w7 uuid;
  v_w9 uuid;
begin
  select id into v_team_id from public.teams limit 1;
  if v_team_id is null then
    raise exception 'No team found. Run Phase 0 bootstrap first.';
  end if;

  -- Fetch the two squad member profile IDs
  select id into v_user_1 from public.profiles where team_id = v_team_id order by created_at asc limit 1;
  select id into v_user_2 from public.profiles where team_id = v_team_id order by created_at desc limit 1;

  -- Fetch week UUIDs for linking
  select id into v_w1 from public.roadmap_weeks where team_id = v_team_id and week_number = 1;
  select id into v_w2 from public.roadmap_weeks where team_id = v_team_id and week_number = 2;
  select id into v_w3 from public.roadmap_weeks where team_id = v_team_id and week_number = 3;
  select id into v_w5 from public.roadmap_weeks where team_id = v_team_id and week_number = 5;
  select id into v_w7 from public.roadmap_weeks where team_id = v_team_id and week_number = 7;
  select id into v_w9 from public.roadmap_weeks where team_id = v_team_id and week_number = 9;

  -- 1. Create or resolve Flagship Project
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

  -- 2. Seed Curated FDE Resources (with anti-tutorial-hell "why_studying" field)
  -- Remove existing starter resources for idempotency if needed, or insert
  delete from public.resources where team_id = v_team_id and title in (
    'Anthropic Prompt Engineering & Tool Use Guide',
    'Supabase pgvector Hybrid Search & HNSW Indexing',
    'Ragas & TruLens: Automated RAG Evaluation Triad',
    'Building Effective Agents (Anthropic Engineering Post)',
    'NVIDIA NIM & vLLM Production Inference Benchmarks',
    'System Design Primer (Donne Martin GitHub)',
    'Palantir Foundry Ontology Core Concepts',
    'Palantir FDE Blog: Decomposition & Customer Discovery'
  );

  insert into public.resources (
    team_id, week_id, title, url, category, resource_type, priority, difficulty, is_free, why_studying
  )
  values
  (
    v_team_id, v_w1,
    'Anthropic Prompt Engineering & Tool Use Guide',
    'https://docs.anthropic.com/en/docs/build-with-claude/tool-use',
    'Applied AI', 'Documentation', 'critical', 'medium', true,
    'Master deterministic JSON schema extraction and failure recovery when parsing messy customer data in Week 1.'
  ),
  (
    v_team_id, v_w2,
    'Supabase pgvector Hybrid Search & HNSW Indexing',
    'https://supabase.com/docs/guides/ai/hybrid-search',
    'Applied AI', 'Documentation', 'critical', 'medium', true,
    'Learn how to combine BM25 full-text search with dense vector embeddings in PostgreSQL using Reciprocal Rank Fusion (RRF).'
  ),
  (
    v_team_id, v_w2,
    'Ragas & TruLens: Automated RAG Evaluation Triad',
    'https://docs.ragas.io/en/stable/concepts/metrics/index.html',
    'Applied AI', 'Documentation', 'high', 'medium', true,
    'Learn retrieval evaluation (Context Precision, Recall@K, Faithfulness) so we can prove how we diagnose bad answers in interviews.'
  ),
  (
    v_team_id, v_w3,
    'Building Effective Agents (Anthropic Engineering Post)',
    'https://www.anthropic.com/research/building-effective-agents',
    'Agents', 'Article', 'critical', 'easy', true,
    'Understand when to use simple prompt-chaining/routing workflows vs. autonomous ReAct loops—a classic AI Startup system design question.'
  ),
  (
    v_team_id, v_w5,
    'NVIDIA NIM & vLLM Production Inference Benchmarks',
    'https://docs.nvidia.com/nim/large-language-models/latest/introduction.html',
    'AI Infrastructure', 'Documentation', 'high', 'hard', true,
    'Understand KV-cache sizing, continuous batching, and TTFT vs. ITL trade-offs when deploying models inside customer VPCs.'
  ),
  (
    v_team_id, v_w7,
    'System Design Primer (Donne Martin GitHub)',
    'https://github.com/donnemartin/system-design-primer',
    'System Design', 'GitHub Repo', 'critical', 'medium', true,
    'Drill back-of-the-envelope capacity estimation, read/write sharding, and async queue backpressure for Palantir Decomposition rounds.'
  ),
  (
    v_team_id, v_w7,
    'Palantir Foundry Ontology Core Concepts',
    'https://www.palantir.com/docs/foundry/ontology/overview/',
    'System Design', 'Documentation', 'critical', 'medium', true,
    'Learn how Palantir models dirty operational tables into Object Types, Properties, Link Types, and Action Types.'
  ),
  (
    v_team_id, v_w9,
    'Palantir FDE Blog: Decomposition & Customer Discovery',
    'https://blog.palantir.com/',
    'Job Preparation', 'Article', 'high', 'medium', true,
    'Learn how Forward Deployed Engineers scope 48-hour high-leverage prototypes with skeptical enterprise stakeholders.'
  );

  -- 3. Seed Starter Engineering Tasks for Weeks 1 & 2
  delete from public.tasks where team_id = v_team_id and title in (
    'Build resilient LLM structured extraction gateway',
    'Implement hybrid BM25 + pgvector retrieval API endpoint',
    'Curate 25-question adversarial RAG evaluation dataset',
    'Publish Week 2 Retrieval Failure Diagnosis Report'
  );

  insert into public.tasks (
    team_id, week_id, project_id, owner_id, title, description, status, priority, due_date, definition_of_done
  )
  values
  (
    v_team_id, v_w1, v_project_id, v_user_1,
    'Build resilient LLM structured extraction gateway',
    'Implement strict schema validation with exponential backoff, fallback model routing, and TTFT/token cost telemetry.',
    'in_progress', 'critical', current_date + 2,
    '[
      {"id": "dod-1", "label": "Strict JSON schema validation enforced on all responses", "checked": true},
      {"id": "dod-2", "label": "Exponential backoff + fallback model tested on simulated 429 errors", "checked": true},
      {"id": "dod-3", "label": "Latency (TTFT) and token usage logged per request", "checked": false},
      {"id": "dod-4", "label": "Reviewed by teammate via GitHub PR", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w2, v_project_id, v_user_1,
    'Implement hybrid BM25 + pgvector retrieval API endpoint',
    'Create the document chunking pipeline and Reciprocal Rank Fusion (RRF) SQL RPC in PostgreSQL.',
    'backlog', 'critical', current_date + 5,
    '[
      {"id": "dod-1", "label": "Endpoint ingests and chunks 50 sample documents with metadata", "checked": false},
      {"id": "dod-2", "label": "Hybrid search (keyword + vector) returns grounded citations", "checked": false},
      {"id": "dod-3", "label": "Input validation and error tests pass", "checked": false},
      {"id": "dod-4", "label": "Peer reviewed and run instructions added to README", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w2, v_project_id, v_user_2,
    'Curate 25-question adversarial RAG evaluation dataset',
    'Build the golden QA test set (including multi-hop and unanswerable queries) and evaluation runner script.',
    'in_progress', 'high', current_date + 4,
    '[
      {"id": "dod-1", "label": "25 diverse test questions with ground-truth source chunk IDs created", "checked": true},
      {"id": "dod-2", "label": "Eval script computes Recall@5 and logs failure cases to markdown", "checked": false},
      {"id": "dod-3", "label": "Reviewed by teammate", "checked": false}
    ]'::jsonb
  ),
  (
    v_team_id, v_w2, v_project_id, null,
    'Publish Week 2 Retrieval Failure Diagnosis Report',
    'Joint deliverable: Run the 25 test queries against our hybrid API, categorize every failure (chunking vs. embedding vs. prompt), and document fixes.',
    'backlog', 'high', current_date + 7,
    '[
      {"id": "dod-1", "label": "Baseline vs. Hybrid Recall@5 metrics recorded", "checked": false},
      {"id": "dod-2", "label": "Top 5 failure modes documented with concrete fixes", "checked": false},
      {"id": "dod-3", "label": "Signed off by both squad members", "checked": false}
    ]'::jsonb
  );
end $$;
