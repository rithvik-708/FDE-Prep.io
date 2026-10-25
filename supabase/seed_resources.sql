-- ============================================================================
-- FDE PREP HUB: SEED UPDATED CURRICULUM RESOURCES (PHASES 1-5 + BOOKS)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vlskwfbnihphxqsszizn/sql
-- ============================================================================

do $$
declare
  v_team_id uuid;
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
  if v_team_id is null then
    raise exception 'No team found in public.teams. Bootstrap the team first.';
  end if;

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

  -- Remove all existing resources for this team so we cleanly replace with the official syllabus
  delete from public.resources where team_id = v_team_id;

  -- Insert the 36 new curated resources across all 5 phases + books
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

  raise notice 'Successfully replaced and seeded % resources across 5 phases and books.', 36;
end $$;
