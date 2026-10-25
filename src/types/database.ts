export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ResourceStatus = 'not_started' | 'in_progress' | 'reviewed';
export type InterviewTrack = 'palantir' | 'ai_startup';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type DoDItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type LearningObjective = {
  id: string;
  text: string;
  completed_by: string[]; // Array of profile UUIDs
};

export type Team = {
  id: string;
  name: string;
  active_week: number;
  created_at: string;
};

export type Profile = {
  id: string;
  team_id: string | null;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  current_streak: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
  teams?: {
    name: string;
    active_week: number;
  } | null;
};

export type RoadmapWeek = {
  id: string;
  team_id: string;
  week_number: number;
  phase_number: number;
  phase_title: string;
  title: string;
  learning_objectives: LearningObjective[];
  practical_task: string;
  joint_deliverable: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  live_url: string | null;
  status: string;
  created_at: string;
};

export type Task = {
  id: string;
  team_id: string;
  week_id: string | null;
  project_id: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  due_date: string | null;
  github_pr_url: string | null;
  definition_of_done: DoDItem[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: string;
  team_id: string;
  week_id: string | null;
  title: string;
  url: string;
  category: string;
  resource_type: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  is_free: boolean;
  why_studying: string;
  created_at: string;
};

export type ResourceProgress = {
  resource_id: string;
  user_id: string;
  status: ResourceStatus;
  personal_notes: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type ResourceWithProgress = {
  id: string;
  team_id: string;
  week_id: string | null;
  title: string;
  url: string;
  category: string;
  resource_type: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  is_free: boolean;
  why_studying: string;
  progress: {
    user_id: string;
    status: ResourceStatus;
    personal_notes: string | null;
  }[];
};

export type InterviewQuestion = {
  id: string;
  team_id: string;
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
  question_text: string;
  review_checklist: string[];
  created_at: string;
};

export type QuestionAttempt = {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  peer_reviewer_id: string | null;
  peer_feedback: string | null;
  confidence_rating: number | null;
  last_reviewed_at: string;
  next_review_date: string | null;
};

export type MockInterview = {
  id: string;
  team_id: string;
  interviewer_id: string;
  candidate_id: string;
  track: InterviewTrack;
  interview_type: string;
  scheduled_at: string;
  status: string;
  overall_score: number | null;
  rubric_scores: Record<string, number>;
  strengths: string | null;
  improvements: string | null;
  follow_up_tasks: string | null;
  created_at: string;
};

export type DecisionRecord = {
  id: string;
  team_id: string;
  project_id: string | null;
  author_id: string | null;
  title: string;
  alternatives_considered: string;
  rationale: string;
  tradeoffs: string;
  reconsider_conditions: string;
  created_at: string;
};

export type Note = {
  id: string;
  team_id: string;
  author_id: string;
  week_id: string | null;
  title: string;
  content: string;
  is_shared: boolean;
  note_type: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: Team;
        Insert: Partial<Team>;
        Update: Partial<Team>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      roadmap_weeks: {
        Row: RoadmapWeek;
        Insert: Partial<RoadmapWeek>;
        Update: Partial<RoadmapWeek>;
        Relationships: [
          {
            foreignKeyName: "roadmap_weeks_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project>;
        Update: Partial<Project>;
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task>;
        Update: Partial<Task>;
        Relationships: [
          {
            foreignKeyName: "tasks_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      resources: {
        Row: Resource;
        Insert: Partial<Resource>;
        Update: Partial<Resource>;
        Relationships: [
          {
            foreignKeyName: "resources_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      resource_progress: {
        Row: ResourceProgress;
        Insert: Partial<ResourceProgress>;
        Update: Partial<ResourceProgress>;
        Relationships: [
          {
            foreignKeyName: "resource_progress_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          }
        ];
      };
      interview_questions: {
        Row: InterviewQuestion;
        Insert: Partial<InterviewQuestion>;
        Update: Partial<InterviewQuestion>;
        Relationships: [
          {
            foreignKeyName: "interview_questions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      question_attempts: {
        Row: QuestionAttempt;
        Insert: Partial<QuestionAttempt>;
        Update: Partial<QuestionAttempt>;
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "interview_questions";
            referencedColumns: ["id"];
          }
        ];
      };
      mock_interviews: {
        Row: MockInterview;
        Insert: Partial<MockInterview>;
        Update: Partial<MockInterview>;
        Relationships: [
          {
            foreignKeyName: "mock_interviews_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      decisions: {
        Row: DecisionRecord;
        Insert: Partial<DecisionRecord>;
        Update: Partial<DecisionRecord>;
        Relationships: [
          {
            foreignKeyName: "decisions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      notes: {
        Row: Note;
        Insert: Partial<Note>;
        Update: Partial<Note>;
        Relationships: [
          {
            foreignKeyName: "notes_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_team_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
  };
};
