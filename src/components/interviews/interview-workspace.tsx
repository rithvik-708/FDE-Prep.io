'use client';

import { useState, useTransition } from 'react';
import {
  createInterviewQuestion,
  createMockInterview,
  gradeMockInterview,
  saveQuestionAttempt,
  submitPeerFeedback,
} from '@/lib/actions/interviews';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DifficultyLevel,
  InterviewTrack,
  Profile,
} from '@/types/database';

export interface QuestionAttemptRow {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  peer_reviewer_id: string | null;
  peer_feedback: string | null;
  confidence_rating: number | null;
  last_reviewed_at: string;
  next_review_date: string | null;
}

export interface InterviewQuestionWithAttempts {
  id: string;
  team_id: string;
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
  question_text: string;
  review_checklist: string[];
  attempts: QuestionAttemptRow[];
}

export interface MockInterviewRow {
  id: string;
  team_id: string;
  interviewer_id: string;
  candidate_id: string;
  track: InterviewTrack;
  interview_type: string;
  scheduled_at: string;
  status: string;
  overall_score: number | null;
  rubric_scores: {
    problem_decomposition?: number;
    technical_depth?: number;
    communication_clarity?: number;
    customer_orientation?: number;
  };
  strengths: string | null;
  improvements: string | null;
  follow_up_tasks: string | null;
}

interface InterviewWorkspaceProps {
  teamId: string;
  currentUserId: string;
  teammates: Profile[];
  questions: InterviewQuestionWithAttempts[];
  mockInterviews: MockInterviewRow[];
}

export function InterviewWorkspace({
  teamId,
  currentUserId,
  teammates,
  questions,
  mockInterviews,
}: InterviewWorkspaceProps) {
  const [topicFilter, setTopicFilter] = useState('all');
  const [activeQuestion, setActiveQuestion] =
    useState<InterviewQuestionWithAttempts | null>(null);
  const [myAnswerDraft, setMyAnswerDraft] = useState('');
  const [myConfidence, setMyConfidence] = useState<number>(3);
  const [peerFeedbackDraft, setPeerFeedbackDraft] = useState('');
  const [checkedRubric, setCheckedRubric] = useState<Record<number, boolean>>(
    {}
  );

  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [scheduleMockOpen, setScheduleMockOpen] = useState(false);
  const [gradingMock, setGradingMock] = useState<MockInterviewRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const teammate = teammates.find((m) => m.id !== currentUserId) ?? teammates[0];

  const getMemberName = (userId: string) =>
    teammates.find((m) => m.id === userId)?.display_name ?? 'Member';

  const openPracticeModal = (q: InterviewQuestionWithAttempts) => {
    setActiveQuestion(q);
    const myAttempt = q.attempts?.find((a) => a.user_id === currentUserId);
    const peerAttempt = q.attempts?.find((a) => a.user_id !== currentUserId);

    setMyAnswerDraft(myAttempt?.answer_text ?? '');
    setMyConfidence(myAttempt?.confidence_rating ?? 3);
    setPeerFeedbackDraft(peerAttempt?.peer_feedback ?? '');
    setCheckedRubric({});
  };

  const handleSaveMyAttempt = () => {
    if (!activeQuestion) return;
    startTransition(async () => {
      await saveQuestionAttempt(
        activeQuestion.id,
        myAnswerDraft,
        myConfidence
      );
      setActiveQuestion(null);
    });
  };

  const handleSavePeerFeedback = (peerAttemptId: string) => {
    startTransition(async () => {
      await submitPeerFeedback(peerAttemptId, peerFeedbackDraft);
      setActiveQuestion(null);
    });
  };

  const handleCreateQuestion = (formData: FormData) => {
    startTransition(async () => {
      const res = await createInterviewQuestion(formData);
      if (res?.success) setAddQuestionOpen(false);
    });
  };

  const handleScheduleMock = (formData: FormData) => {
    startTransition(async () => {
      const res = await createMockInterview(formData);
      if (res?.success) setScheduleMockOpen(false);
    });
  };

  const handleGradeMock = (formData: FormData) => {
    startTransition(async () => {
      const res = await gradeMockInterview(formData);
      if (res?.success) setGradingMock(null);
    });
  };

  const renderQuestionList = (track: InterviewTrack) => {
    const trackQuestions = questions.filter((q) => q.track === track);
    const topics = Array.from(new Set(trackQuestions.map((q) => q.topic)));

    const visibleQuestions = trackQuestions.filter(
      (q) => topicFilter === 'all' || q.topic === topicFilter
    );

    return (
      <div className="space-y-4">
        {/* Topic Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={topicFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTopicFilter('all')}
            className={cn(
              'h-7 text-xs',
              topicFilter === 'all'
                ? 'bg-emerald-600 text-zinc-950 font-semibold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            )}
          >
            All Topics ({trackQuestions.length})
          </Button>
          {topics.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={topicFilter === t ? 'default' : 'outline'}
              onClick={() => setTopicFilter(t)}
              className={cn(
                'h-7 text-xs',
                topicFilter === t
                  ? 'bg-emerald-600 text-zinc-950 font-semibold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300'
              )}
            >
              {t}
            </Button>
          ))}
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 gap-3">
          {visibleQuestions.map((q) => {
            const myAttempt = q.attempts?.find(
              (a) => a.user_id === currentUserId
            );
            const peerAttempt = q.attempts?.find(
              (a) => a.user_id !== currentUserId
            );
            const checklist = Array.isArray(q.review_checklist)
              ? q.review_checklist
              : [];

            return (
              <div
                key={q.id}
                onClick={() => openPracticeModal(q)}
                className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-zinc-950 border-zinc-700 text-zinc-200"
                    >
                      {q.topic}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono uppercase',
                        q.difficulty === 'hard'
                          ? 'border-red-500/30 text-red-300 bg-red-500/10'
                          : q.difficulty === 'medium'
                          ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                          : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                      )}
                    >
                      {q.difficulty}
                    </Badge>
                  </div>

                  {/* Squad Readiness Pills */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded border',
                        myAttempt
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                      )}
                    >
                      You:{' '}
                      {myAttempt
                        ? `Conf ${myAttempt.confidence_rating}/5`
                        : 'Unanswered'}
                    </span>

                    {teammate && (
                      <span
                        className={cn(
                          'text-[10px] font-mono px-2 py-0.5 rounded border',
                          peerAttempt
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        )}
                      >
                        {teammate.display_name}:{' '}
                        {peerAttempt
                          ? `Conf ${peerAttempt.confidence_rating}/5`
                          : 'Unanswered'}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors leading-relaxed">
                  {q.question_text}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70 text-[11px] font-mono text-zinc-400">
                  <span>{checklist.length} Rubric Checkpoints</span>
                  {myAttempt?.next_review_date && (
                    <span>Next Review: {myAttempt.next_review_date}</span>
                  )}
                  <span className="text-emerald-400 group-hover:underline">
                    Practice & Peer Review →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>
            Drill answers against explicit engineering checklists and grade each other&apos;s mocks with rubrics.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Schedule Mock Interview Modal */}
          <Dialog open={scheduleMockOpen} onOpenChange={setScheduleMockOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-zinc-900 border-zinc-800 gap-1.5"
                >
                  <CalendarClock className="h-3.5 w-3.5 text-amber-400" />
                  Schedule Mock
                </Button>
              }
            />
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  Schedule Peer Mock Interview
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Alternate interviewer and candidate roles every week.
                </DialogDescription>
              </DialogHeader>
              <form action={handleScheduleMock} className="space-y-4 pt-1">
                <input type="hidden" name="teamId" value={teamId} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Interviewer</Label>
                    <select
                      name="interviewerId"
                      defaultValue={currentUserId}
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {teammates.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Candidate</Label>
                    <select
                      name="candidateId"
                      defaultValue={teammate?.id ?? currentUserId}
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {teammates.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Target Track</Label>
                    <select
                      name="track"
                      defaultValue="palantir"
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value="palantir">Track A: Palantir</option>
                      <option value="ai_startup">Track B: AI Startup</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Round Type</Label>
                    <select
                      name="interviewType"
                      defaultValue="Decomposition & System Design"
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value="Decomposition & System Design">
                        Decomposition & System Design
                      </option>
                      <option value="RAG & Agent Debugging">
                        RAG & Agent Debugging
                      </option>
                      <option value="Customer Discovery Roleplay">
                        Customer Discovery Roleplay
                      </option>
                      <option value="Coding & Algorithms">
                        Coding & Algorithms
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Date & Time</Label>
                  <Input
                    name="scheduledAt"
                    type="datetime-local"
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScheduleMockOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs"
                  >
                    Schedule Session
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Question Modal */}
          <Dialog open={addQuestionOpen} onOpenChange={setAddQuestionOpen}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Question
                </Button>
              }
            />
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  Add Interview Question & Rubric
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Include a specific review checklist so you can grade answers objectively.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateQuestion} className="space-y-4 pt-1">
                <input type="hidden" name="teamId" value={teamId} />
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Track</Label>
                    <select
                      name="track"
                      defaultValue="ai_startup"
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value="palantir">Palantir</option>
                      <option value="ai_startup">AI Startup</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Topic</Label>
                    <Input
                      name="topic"
                      placeholder="e.g., RAG Debugging"
                      required
                      className="bg-zinc-950 border-zinc-800 text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Difficulty</Label>
                    <select
                      name="difficulty"
                      defaultValue="hard"
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Question Prompt *</Label>
                  <Textarea
                    name="questionText"
                    rows={3}
                    required
                    placeholder="Describe the scenario or system design challenge..."
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-emerald-400">
                    Review Checklist (One checkpoint per line)
                  </Label>
                  <Textarea
                    name="checklistRaw"
                    rows={4}
                    placeholder={`Did you distinguish retrieval failures from generation failures?\nDid you inspect the source chunks?\nDid you propose a regression test?`}
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddQuestionOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs"
                  >
                    Save Question
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main 3-Way Tabs: Track A (Palantir), Track B (AI Startups), Mock Tracker */}
      <Tabs
        defaultValue="ai_startup"
        onValueChange={() => setTopicFilter('all')}
        className="space-y-4"
      >
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto flex flex-wrap justify-start gap-1">
          <TabsTrigger
            value="ai_startup"
            className="text-xs font-mono data-active:bg-emerald-600 data-active:text-zinc-950 data-active:font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-zinc-950 data-[state=active]:font-bold px-3 py-1.5 gap-1.5"
          >
            <Cpu className="h-3.5 w-3.5" />
            Track B: AI Startups (
            {questions.filter((q) => q.track === 'ai_startup').length})
          </TabsTrigger>
          <TabsTrigger
            value="palantir"
            className="text-xs font-mono data-active:bg-emerald-600 data-active:text-zinc-950 data-active:font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-zinc-950 data-[state=active]:font-bold px-3 py-1.5 gap-1.5"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Track A: Palantir FDE (
            {questions.filter((q) => q.track === 'palantir').length})
          </TabsTrigger>
          <TabsTrigger
            value="mocks"
            className="text-xs font-mono data-active:bg-emerald-600 data-active:text-zinc-950 data-active:font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-zinc-950 data-[state=active]:font-bold px-3 py-1.5 gap-1.5"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Mock Interview Tracker ({mockInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai_startup">
          {renderQuestionList('ai_startup')}
        </TabsContent>

        <TabsContent value="palantir">
          {renderQuestionList('palantir')}
        </TabsContent>

        <TabsContent value="mocks" className="space-y-4">
          {mockInterviews.length === 0 ? (
            <Card className="bg-zinc-900/60 border-zinc-800 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-200">
                No Mock Interviews Logged Yet
              </p>
              <p className="text-xs text-zinc-400">
                Click &ldquo;Schedule Mock&rdquo; above to book your Saturday 4:00 PM session and grade it using our 4-pillar FDE rubric.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockInterviews.map((mock) => {
                const isCompleted = mock.status === 'completed';
                return (
                  <Card
                    key={mock.id}
                    className="bg-zinc-900/70 border-zinc-800/90"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono uppercase border-emerald-500/30 text-emerald-300"
                        >
                          {mock.track.replace('_', ' ')} · {mock.interview_type}
                        </Badge>
                        <span className="text-xs font-mono text-zinc-400">
                          {new Date(mock.scheduled_at).toLocaleString()}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-bold text-zinc-100 pt-1 flex items-center justify-between">
                        <span>
                          Candidate: {getMemberName(mock.candidate_id)} (Interviewer:{' '}
                          {getMemberName(mock.interviewer_id)})
                        </span>
                        {isCompleted && mock.overall_score && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Score: {mock.overall_score}/5
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {isCompleted ? (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center">
                              <span className="text-[10px] font-mono text-zinc-400 block">
                                Decomp
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-100">
                                {mock.rubric_scores?.problem_decomposition ?? '-'}/5
                              </span>
                            </div>
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center">
                              <span className="text-[10px] font-mono text-zinc-400 block">
                                Tech Depth
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-100">
                                {mock.rubric_scores?.technical_depth ?? '-'}/5
                              </span>
                            </div>
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center">
                              <span className="text-[10px] font-mono text-zinc-400 block">
                                Clarity
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-100">
                                {mock.rubric_scores?.communication_clarity ?? '-'}/5
                              </span>
                            </div>
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center">
                              <span className="text-[10px] font-mono text-zinc-400 block">
                                Customer
                              </span>
                              <span className="text-xs font-mono font-bold text-zinc-100">
                                {mock.rubric_scores?.customer_orientation ?? '-'}/5
                              </span>
                            </div>
                          </div>

                          {mock.strengths && (
                            <div className="p-2.5 rounded bg-zinc-950/90 border border-zinc-800 text-xs">
                              <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                                Strengths:
                              </span>
                              <p className="text-zinc-300 mt-0.5">{mock.strengths}</p>
                            </div>
                          )}
                          {mock.improvements && (
                            <div className="p-2.5 rounded bg-zinc-950/90 border border-zinc-800 text-xs">
                              <span className="text-[10px] font-mono uppercase text-amber-400 block">
                                Gaps / Improvements:
                              </span>
                              <p className="text-zinc-300 mt-0.5">
                                {mock.improvements}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                          <span className="text-xs text-zinc-400">
                            Session scheduled. Complete rubric scorecard after the drill.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setGradingMock(mock)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold"
                          >
                            Grade Rubric
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Question Practice, Self-Rubric & Peer Review Modal */}
      <Dialog
        open={!!activeQuestion}
        onOpenChange={(o) => !o && setActiveQuestion(null)}
      >
        {activeQuestion && (
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono uppercase border-emerald-500/30 text-emerald-300"
                >
                  {activeQuestion.track.replace('_', ' ')} ·{' '}
                  {activeQuestion.topic}
                </Badge>
              </div>
              <DialogTitle className="text-sm font-bold text-zinc-100 leading-relaxed pt-1">
                {activeQuestion.question_text}
              </DialogTitle>
            </DialogHeader>

            {/* Self-Review Rubric Checkpoints */}
            <div className="space-y-2 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block">
                Review Rubric Checkpoints (Verify your answer covers these)
              </span>
              {(activeQuestion.review_checklist ?? []).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    setCheckedRubric((prev) => ({
                      ...prev,
                      [idx]: !prev[idx],
                    }))
                  }
                  className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer py-1"
                >
                  <Checkbox
                    checked={!!checkedRubric[idx]}
                    onCheckedChange={(checked) =>
                      setCheckedRubric((prev) => ({
                        ...prev,
                        [idx]: !!checked,
                      }))
                    }
                    className="mt-0.5 data-checked:bg-emerald-500 data-checked:border-emerald-500 data-checked:text-zinc-950"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Your Answer & Confidence Score */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase text-zinc-300">
                  Your Structured Answer / Architecture Outline
                </Label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-zinc-400 mr-1">
                    Confidence:
                  </span>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setMyConfidence(score)}
                      className={cn(
                        'h-6 w-6 rounded text-xs font-mono border transition-colors cursor-pointer',
                        myConfidence === score
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={myAnswerDraft}
                onChange={(e) => setMyAnswerDraft(e.target.value)}
                rows={6}
                placeholder="Write your structured approach: 1) Clarifying questions & metrics, 2) Failure isolation / Data ontology, 3) Architecture & trade-offs, 4) Regression test..."
                className="bg-zinc-950 border-zinc-800 text-xs font-mono leading-relaxed"
              />

              {/* Show Peer Feedback on Your Answer if Present */}
              {(() => {
                const myAttempt = activeQuestion.attempts?.find(
                  (a) => a.user_id === currentUserId
                );
                if (!myAttempt?.peer_feedback) return null;
                return (
                  <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/30 text-xs space-y-1">
                    <span className="text-[10px] font-mono uppercase text-sky-400 block">
                      Peer Feedback from Teammate:
                    </span>
                    <p className="text-zinc-200">{myAttempt.peer_feedback}</p>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={isPending || !myAnswerDraft.trim()}
                  onClick={handleSaveMyAttempt}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Save Answer & Schedule Spaced Review
                </Button>
              </div>
            </div>

            {/* Teammate's Answer & Peer Review Section */}
            {(() => {
              const peerAttempt = activeQuestion.attempts?.find(
                (a) => a.user_id !== currentUserId
              );
              if (!peerAttempt) {
                return (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-500">
                    {teammate?.display_name ?? 'Your teammate'} hasn&apos;t submitted an answer to this question yet.
                  </div>
                );
              }

              return (
                <div className="space-y-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-sky-400 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {getMemberName(peerAttempt.user_id)}&apos;s Answer (Confidence:{' '}
                      {peerAttempt.confidence_rating}/5)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                    {peerAttempt.answer_text}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-300">
                      Leave Peer Critique for {getMemberName(peerAttempt.user_id)}
                    </Label>
                    <Textarea
                      value={peerFeedbackDraft}
                      onChange={(e) => setPeerFeedbackDraft(e.target.value)}
                      rows={2}
                      placeholder="Which rubric points did they nail, and what edge case or metric did they miss?"
                      className="bg-zinc-950 border-zinc-800 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleSavePeerFeedback(peerAttempt.id)}
                      className="h-8 text-xs bg-zinc-800 border-zinc-700"
                    >
                      Submit Peer Critique
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        )}
      </Dialog>

      {/* Mock Interview Rubric Grading Modal */}
      <Dialog
        open={!!gradingMock}
        onOpenChange={(o) => !o && setGradingMock(null)}
      >
        {gradingMock && (
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Grade Mock Interview Rubric
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Score each dimension from 1 (Needs Major Work) to 5 (Hire / Strong FDE Signal).
              </DialogDescription>
            </DialogHeader>
            <form action={handleGradeMock} className="space-y-4">
              <input type="hidden" name="mockId" value={gradingMock.id} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">
                    Problem Decomposition (1–5)
                  </Label>
                  <Input
                    name="scoreDecomposition"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={4}
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">
                    Technical Depth (1–5)
                  </Label>
                  <Input
                    name="scoreTechnical"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={4}
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">
                    Communication Clarity (1–5)
                  </Label>
                  <Input
                    name="scoreCommunication"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={4}
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">
                    Customer Value Focus (1–5)
                  </Label>
                  <Input
                    name="scoreCustomer"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={4}
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-emerald-400">
                  Key Strengths Observed
                </Label>
                <Textarea
                  name="strengths"
                  rows={2}
                  required
                  placeholder="What did the candidate structure well?"
                  className="bg-zinc-950 border-zinc-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-amber-400">
                  Specific Gaps / Improvements Required
                </Label>
                <Textarea
                  name="improvements"
                  rows={2}
                  required
                  placeholder="Where did they get stuck or skip trade-offs?"
                  className="bg-zinc-950 border-zinc-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Follow-up Action Items
                </Label>
                <Input
                  name="followUpTasks"
                  placeholder="e.g., Re-drill pgvector ACL filtering before Wednesday"
                  className="bg-zinc-950 border-zinc-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setGradingMock(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs"
                >
                  Save Rubric Scorecard
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
