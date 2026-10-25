-- ============================================================================
-- FDE PREP HUB: PHASE 5 SEED (PALANTIR & AI STARTUP QUESTIONS + ADR LOG)
-- ============================================================================

do $$
declare
  v_team_id uuid;
  v_project_id uuid;
  v_user_1 uuid;
  v_user_2 uuid;
begin
  select id into v_team_id from public.teams limit 1;
  if v_team_id is null then
    raise exception 'No team found. Run Phase 0 bootstrap first.';
  end if;

  select id into v_project_id from public.projects where team_id = v_team_id limit 1;
  select id into v_user_1 from public.profiles where team_id = v_team_id order by created_at asc limit 1;
  select id into v_user_2 from public.profiles where team_id = v_team_id order by created_at desc limit 1;

  -- 1. Seed Track A (Palantir) & Track B (AI Startup) Interview Questions
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

  -- 2. Seed Sample Architecture Decision Record (ADR)
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

  -- 3. Seed Sample Weekly Retrospective Note
  insert into public.notes (
    team_id, author_id, title, content, is_shared, note_type
  )
  values (
    v_team_id, v_user_1,
    'Week 1 Retrospective & Sprint Alignment',
    E'### What We Shipped\n- FDE Prep Hub v1 live on Vercel + Supabase with RLS.\n- Structured output LLM gateway with Zod schema enforcement.\n\n### Where We Struggled\n- Naive fixed-size token chunking split markdown tables in half during initial PDF tests.\n\n### What Changes in Week 2\n- Switch to markdown-header-aware semantic chunking and benchmark Recall@5 before touching the UI.',
    true, 'retrospective'
  );
end $$;
