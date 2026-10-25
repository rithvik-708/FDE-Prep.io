-- ============================================================================
-- FDE PREP HUB: 12-WEEK CURRICULUM SEED (6 PHASES)
-- ============================================================================

do $$
declare
  v_team_id uuid;
begin
  select id into v_team_id from public.teams limit 1;

  if v_team_id is null then
    raise exception 'No team found in public.teams. Run the Phase 0 bootstrap block first.';
  end if;

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
    'Implement retrieval over 50 sample technical docs, test 25 adversarial queries, and log retrieval vs. generation failures.',
    'Working document retrieval API with hybrid search, citation grounding, and a markdown evaluation report.',
    'Always separate retrieval failures (wrong chunks fetched) from generation hallucinations (model ignored context).'
  ),

  -- PHASE 2: AGENTS & TOOL CALLING (Weeks 3-4)
  (
    v_team_id, 3, 2, 'Agents and Tool Calling',
    'Deterministic Tool Calling, ReAct Loops & Sandboxed Execution',
    '[
      {"id": "w3-1", "text": "Design idempotent, strongly-typed tool definitions with clear error recovery strings", "completed_by": []},
      {"id": "w3-2", "text": "Build a bounded ReAct loop from scratch without heavy framework magic", "completed_by": []},
      {"id": "w3-3", "text": "Implement human-in-the-loop (HITL) approval gates for mutating database/API tool calls", "completed_by": []}
    ]'::jsonb,
    'Create an agent capable of querying a PostgreSQL database and REST APIs safely, with SQL injection guards and step limits.',
    'Tool-calling agent service with full execution trace logging and human confirmation hooks.',
    'Avoid black-box agent frameworks when possible; FDE interviewers ask how you control infinite loops and bad tool args.'
  ),
  (
    v_team_id, 4, 2, 'Agents and Tool Calling',
    'Multi-Step Workflows, State Machines & Agent Observability',
    '[
      {"id": "w4-1", "text": "Architect DAG / state-machine workflows for long-running asynchronous tasks", "completed_by": []},
      {"id": "w4-2", "text": "Persist agent checkpoint state in Postgres to resume after process crashes", "completed_by": []},
      {"id": "w4-3", "text": "Build trace inspection views to debug token burn and step-level latency", "completed_by": []}
    ]'::jsonb,
    'Build a multi-step research & data-reconciliation workflow that ingests messy customer tickets and proposes verified SQL patches.',
    'Resumable workflow engine with step-by-step trace replay UI and automated regression suite.',
    ''
  ),

  -- PHASE 3: DEPLOYMENT, INFRASTRUCTURE & SECURITY (Weeks 5-6)
  (
    v_team_id, 5, 3, 'Deployment, Infrastructure, and Security',
    'Containerization, Async Workers & Low-Latency Inference',
    '[
      {"id": "w5-1", "text": "Write multi-stage production Dockerfiles and orchestrate API + Worker + Redis + Postgres via Docker Compose", "completed_by": []},
      {"id": "w5-2", "text": "Decouple heavy ingestion jobs using background queues and SSE/WebSocket progress updates", "completed_by": []},
      {"id": "w5-3", "text": "Benchmark self-hosted / NIM / vLLM endpoints vs. managed APIs for throughput and cost", "completed_by": []}
    ]'::jsonb,
    'Containerize the RAG + Agent stack, move document indexing to background workers, and load-test with 50 concurrent requests.',
    'One-command Dockerized deployment stack with health checks, structured JSON logs, and queue backpressure.',
    ''
  ),
  (
    v_team_id, 6, 3, 'Deployment, Infrastructure, and Security',
    'Enterprise Security: RBAC, Document ACLs & Prompt Injection Defense',
    '[
      {"id": "w6-1", "text": "Enforce document-level Access Control Lists (ACLs) inside vector retrieval queries", "completed_by": []},
      {"id": "w6-2", "text": "Implement PII redaction pipelines and audit logging for regulated enterprise environments", "completed_by": []},
      {"id": "w6-3", "text": "Test and mitigate indirect prompt injection and data exfiltration vectors", "completed_by": []}
    ]'::jsonb,
    'Add multi-tenant RLS and document-level permissions to the retrieval API so User A can never retrieve User B chunks.',
    'Security-hardened RAG pipeline with ACL filtering tests and an enterprise threat-model document.',
    'Palantir and enterprise AI startups heavily test how permissions propagate from source systems into embeddings.'
  ),

  -- PHASE 4: SYSTEM DESIGN & AI ARCHITECTURE (Weeks 7-8)
  (
    v_team_id, 7, 4, 'System Design and AI Architecture',
    'Data-Intensive Distributed Systems & Ontology Modeling',
    '[
      {"id": "w7-1", "text": "Design ontology layers mapping dirty enterprise ERPs/CRMs into clean semantic objects and links", "completed_by": []},
      {"id": "w7-2", "text": "Master CDC (Change Data Capture), idempotent ETL pipelines, and schema evolution", "completed_by": []},
      {"id": "w7-3", "text": "Size storage, read/write QPS, caching layers, and failure domains under strict SLAs", "completed_by": []}
    ]'::jsonb,
    'Complete two 45-minute Palantir-style Decomposition & System Design whiteboard drills with written architectural critiques.',
    'Two full architecture design docs (Ontology Data Platform + Real-Time Operational Alerting System).',
    ''
  ),
  (
    v_team_id, 8, 4, 'System Design and AI Architecture',
    'End-to-End AI System Design, Cost Modeling & Reliability',
    '[
      {"id": "w8-1", "text": "Design hybrid batch + real-time AI pipelines balancing accuracy, latency (<1.5s), and unit economics", "completed_by": []},
      {"id": "w8-2", "text": "Implement semantic caching, tiered model routing (small fast model -> frontier model), and circuit breakers", "completed_by": []},
      {"id": "w8-3", "text": "Design online monitoring for data drift, hallucination spikes, and thumbs-down feedback loops", "completed_by": []}
    ]'::jsonb,
    'Run a live production incident simulation where retrieval latency spikes 10x and answer quality drops; diagnose and mitigate.',
    'Production AI Architecture Playbook + completed incident post-mortem template.',
    ''
  ),

  -- PHASE 5: CUSTOMER DISCOVERY & COMMUNICATION (Weeks 9-10)
  (
    v_team_id, 9, 5, 'Customer Discovery and Communication',
    'Ambiguous Problem Decomposition & Stakeholder Discovery',
    '[
      {"id": "w9-1", "text": "Translate vague executive complaints (\"our supply chain is slow\") into concrete data hypotheses", "completed_by": []},
      {"id": "w9-2", "text": "Scope a 48-hour high-leverage MVP prototype vs. a 6-month boiling-the-ocean trap", "completed_by": []},
      {"id": "w9-3", "text": "Define measurable operational KPIs (hours saved, defect rate reduction, $ impact) before writing code", "completed_by": []}
    ]'::jsonb,
    'Roleplay two 30-minute Customer Discovery calls where one person acts as a skeptical VP of Operations with messy data.',
    'Two 1-page FDE Deployment Proposals scoping a Week-1 prototype, data requirements, and ROI metrics.',
    ''
  ),
  (
    v_team_id, 10, 5, 'Customer Discovery and Communication',
    'Live Technical Demos, Pushback Handling & Behavioral Stories',
    '[
      {"id": "w10-1", "text": "Structure 5 STAR+Engineering stories covering conflict, production failure, tight deadlines, and ambiguity", "completed_by": []},
      {"id": "w10-2", "text": "Deliver crisp 5-minute live product demos starting with business value before diving into architecture", "completed_by": []},
      {"id": "w10-3", "text": "Handle hostile or skeptical customer objections calmly when a live demo hits an edge case", "completed_by": []}
    ]'::jsonb,
    'Record and critique a 5-minute walkthrough of your flagship project; drill every behavioral question in the bank.',
    'Polished behavioral story matrix + recorded technical demo with peer rubric sign-off.',
    ''
  ),

  -- PHASE 6: FLAGSHIP PROJECT & INTERVIEWS (Weeks 11-12)
  (
    v_team_id, 11, 6, 'Flagship Project and Interviews',
    'Flagship FDE Capstone: End-to-End Polish, Evals & Telemetry',
    '[
      {"id": "w11-1", "text": "Ship a cohesive, domain-specific AI operational platform (ingestion -> ontology -> RAG/Agent -> eval dashboard)", "completed_by": []},
      {"id": "w11-2", "text": "Document every architectural trade-off in the ADR log (why pgvector, why chunk size X, how failures are caught)", "completed_by": []},
      {"id": "w11-3", "text": "Verify zero-cold-start live deployment, seeded demo account, and clean GitHub README with architecture diagrams", "completed_by": []}
    ]'::jsonb,
    'Freeze flagship project features, run end-to-end load and eval benchmarks, and conduct a brutal code & architecture review.',
    'Production-hosted Flagship FDE System with live telemetry, evaluation benchmarks, and ADR documentation.',
    ''
  ),
  (
    v_team_id, 12, 6, 'Flagship Project and Interviews',
    'Full Dress-Rehearsal Mock Loops (Palantir & AI Startup Tracks)',
    '[
      {"id": "w12-1", "text": "Complete full back-to-back mock loops: Coding + Decomposition + System Design + Customer Scenario", "completed_by": []},
      {"id": "w12-2", "text": "Complete AI Startup live-coding & debugging sprint: build/fix a broken RAG/Agent pipeline in 45 minutes", "completed_by": []},
      {"id": "w12-3", "text": "Close all remaining high-priority gaps identified in mock interview rubrics", "completed_by": []}
    ]'::jsonb,
    'Execute 4 full-length timed mock interviews under strict interview conditions with written rubric debriefs.',
    'Signed-off Interview Readiness Scorecard across Coding, Decomposition, Applied AI, and Customer Discovery.',
    ''
  )
  on conflict (team_id, week_number) do update set
    phase_number = excluded.phase_number,
    phase_title = excluded.phase_title,
    title = excluded.title,
    learning_objectives = excluded.learning_objectives,
    practical_task = excluded.practical_task,
    joint_deliverable = excluded.joint_deliverable;
end $$;
