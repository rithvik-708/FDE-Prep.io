# FDE Prep Hub ⚡

> **Mission Command Centre for Forward Deployed Engineer (FDE) and AI Systems Engineering Preparation (Palantir, Tier-1 AI Startups, Applied AI Infra).**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-emerald?style=flat-square&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

---

## 🧭 Overview

**FDE Prep Hub** is a multi-tenant command centre designed to bridge the gap between academic AI knowledge and high-stakes enterprise engineering. It is structured around the unique demands of **Forward Deployed Engineering**: messy data ingestion, kinetic ontology modeling, RAG evaluations, resilient agent state machines, row-level security (RLS), and ambiguous decomposition interview rounds.

---

## 🎯 Key Features

### 1. 📊 Command Centre Dashboard
- **Live Squad Readiness Gauge**: Side-by-side completion analytics across tasks, curriculum learning objectives, and reviewed resources.
- **Sprint Week Tracking**: Dynamic multi-phase tracking with instant week switching and automated streak tracking.
- **Today's Action Queue**: Prioritized view of unblocked tasks and weekly study resources.

### 2. 🗺️ 12-Week Curriculum Spine
- **6 Structured Engineering Phases**:
  - **Phase 1 (Weeks 1–2):** LLM Integration, Structured Outputs & Production RAG
  - **Phase 2 (Weeks 3–4):** Agents, Tool Calling & Palantir Foundry Object Ontology
  - **Phase 3 (Weeks 5–6):** Enterprise Data Pipelines, CDC, Ingestion Sinks & Local LLM Serving
  - **Phase 4 (Weeks 7–8):** Enterprise Security, Document ACLs & LLM Red-Teaming
  - **Phase 5 (Weeks 9–10):** Production Evals (Ragas, TruLens) & Latency/Incident Triage
  - **Phase 6 (Weeks 11–12):** Palantir Decomposition Drills, System Design & Capstone Defense
- **Interactive Checklists**: Objective-level tracking for each team member.
- **Sprint Notes**: Markdown scratchpad for weekly engineering findings and blockers.

### 3. 📚 Curated Knowledge Bank (`/resources`)
- **36 Comprehensive Resources**:
  - Full video courses & playlists across **Core CS, Applied AI, Agents, Backend & APIs, Databases, System Design, and Cloud DevOps**.
  - Canonical engineering textbooks with direct Google Drive links:
    - *AI Engineering* (Chip Huyen)
    - *Designing Data-Intensive Applications* (Martin Kleppmann)
    - *Database System Concepts* (Silberschatz et al.)
    - *Cloud Computing Concepts & Architecture* (Thomas Erl)
    - *Introduction to Algorithms* (CLRS)
    - *LLM Engineer’s Handbook* (Paul Iusztin)
    - *The DevOps Handbook* (Gene Kim et al.)
    - *The Linux Command Line* (William Shotts)
- **Deep Context**: Every card highlights *"Why are we studying this?"* with detailed concepts covered.
- **Independent Progress**: Tracks read/reviewed status and private notes per squad member.

### 4. 📋 Kanban Board & Definition of Done (`/projects`)
- **Strict Quality Gates**: Every task includes a 4-point Definition of Done (DoD) checklist:
  - End-to-end functionality verified
  - Edge cases and failure modes tested
  - Teammate peer review signed off
  - Production runbook & docs written
- **PR Tracking**: Direct links to GitHub Pull Requests.
- **Status Columns**: Backlog, In Progress, Peer Review, and Done.

### 5. 🎙️ Interview Drills & Rubric Workspace (`/interviews`)
- **Two Distinct Tracks**:
  - **Track A (Palantir):** Ambiguous customer decomposition, client pushback, supply chain/hospital operational workflows, and behavioral ownership.
  - **Track B (AI Startups):** RAG debugging, token economics, p95 latency spikes, prompt injection defenses, and agent infinite-loop breakers.
- **Standardized Rubric**: Self & peer evaluation scoring with checklist criteria.

### 6. 🏛️ Team Workspace & Architecture Decision Records (`/team`)
- **ADR Repository**: Formal architectural trade-off logs (Context, Alternatives Considered, Rationale, Reconsideration Conditions).
- **Weekly Retrospectives**: Document what shipped, what failed, and what changes next sprint.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL 15+, pgvector, Row-Level Security, Database Triggers)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + Vanilla CSS Variables
- **Icons**: [Lucide React](https://lucide.dev)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org) with auto-generated database schemas

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or 20+
- A free [Supabase](https://supabase.com) account

### 2. Clone & Install
```bash
git clone https://github.com/your-username/fde-prep-hub.git
cd fde-prep-hub
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
CRON_SECRET=your-secret-key-32-chars
```

*(Refer to `.env.example` for reference).*

### 4. Database Setup & Seeding

Go to your **[Supabase SQL Editor](https://supabase.com/dashboard)** and run:

1. **Schema & Initial Setup**: Run [`supabase/setup_complete.sql`](supabase/setup_complete.sql) to create all tables, enums, triggers, and RLS policies.
2. **Curated Resources**: Run [`supabase/seed_resources.sql`](supabase/seed_resources.sql) to populate the 36 vetted resources.
3. *(Optional Clean Slate)*: Run [`supabase/reset_progress_to_zero.sql`](supabase/reset_progress_to_zero.sql) to reset all progress, streaks, and checklists to 0% for Day 1 prep.

### 5. Run the Dev Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Directory Structure

```text
├── public/                 # Static assets & SVG tab favicon
│   └── icon.svg            # Terminal brand icon
├── src/
│   ├── app/
│   │   ├── (auth)/login/   # Supabase Email & Password Authentication
│   │   ├── (dashboard)/    # Authenticated command centre layout
│   │   │   ├── page.tsx    # Command Centre overview & squad stats
│   │   │   ├── roadmap/    # 12-week curriculum & [week] deep dives
│   │   │   ├── resources/  # Filterable knowledge bank (36 items)
│   │   │   ├── projects/   # Kanban board & Definition of Done
│   │   │   ├── interviews/ # Palantir & AI Startup mock drills
│   │   │   └── team/       # ADR decision log & sprint retros
│   │   ├── api/health/     # Health check endpoint
│   │   ├── globals.css     # Dark theme design system tokens
│   │   └── layout.tsx      # Root HTML layout with JetBrains Mono font
│   ├── components/         # Modular React components
│   │   ├── dashboard/      # Daily plan & readiness widgets
│   │   ├── layout/         # Persistent sidebar & contextual header
│   │   ├── resources/      # ResourceHub & create modal
│   │   ├── roadmap/        # Learning objectives & note editor
│   │   ├── tasks/          # Kanban drag/drop & task dialog
│   │   └── ui/             # Reusable UI primitives (dialog, dropdown, etc.)
│   ├── lib/
│   │   ├── actions/        # Next.js Server Actions (Auth, Tasks, Evals)
│   │   └── supabase/       # SSR Server & Browser Supabase clients
│   └── types/
│       └── database.ts     # TypeScript schema types & enums
└── supabase/
    ├── setup_complete.sql       # Full database migration & bootstrap
    ├── seed_resources.sql       # Curated 36 syllabus resources
    ├── reset_progress_to_zero.sql # Clean-slate 0% progress reset
    └── fix_user_bootstrap.sql   # Account linking helper script
```

---

## 🛡️ Security & Row-Level Security (RLS)

All tables enforce PostgreSQL **Row-Level Security (RLS)**:
- Users can only read and mutate data within their designated squad `team_id`.
- Resource progress tracking is individually scoped per authenticated user ID.
- Personal notes and draft interview feedback remain private until explicitly shared with squad members.

---

## 📜 License

MIT License. Built for engineers preparing for Forward Deployed Engineering and High-Agency AI Builder roles.
