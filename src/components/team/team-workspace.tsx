'use client';

import { useState, useTransition } from 'react';
import {
  createDecision,
  createTeamNote,
  deleteTeamNote,
} from '@/lib/actions/team';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FileCode2,
  GitBranch,
  Lock,
  Plus,
  RefreshCcw,
  Scale,
  Trash2,
  Users2,
} from 'lucide-react';
import type { Profile } from '@/types/database';

export interface DecisionRow {
  id: string;
  author_id: string | null;
  title: string;
  alternatives_considered: string;
  rationale: string;
  tradeoffs: string;
  reconsider_conditions: string;
  created_at: string;
}

export interface NoteRow {
  id: string;
  author_id: string;
  title: string;
  content: string;
  is_shared: boolean;
  note_type: string;
  created_at: string;
}

interface TeamWorkspaceProps {
  teamId: string;
  currentUserId: string;
  teammates: Profile[];
  decisions: DecisionRow[];
  notes: NoteRow[];
}

export function TeamWorkspace({
  teamId,
  currentUserId,
  teammates,
  decisions,
  notes,
}: TeamWorkspaceProps) {
  const [adrOpen, setAdrOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getAuthorName = (authorId: string | null) =>
    teammates.find((m) => m.id === authorId)?.display_name ?? 'Squad';

  const handleCreateAdr = (formData: FormData) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createDecision(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setAdrOpen(false);
      }
    });
  };

  const handleCreateNote = (formData: FormData) => {
    startTransition(async () => {
      const res = await createTeamNote(formData);
      if (res?.success) setNoteOpen(false);
    });
  };

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      await deleteTeamNote(noteId);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">
          Record durable architectural decisions and weekly retrospectives so you can defend every trade-off in technical deep-dive interviews.
        </p>

        <div className="flex items-center gap-2">
          {/* Add Note / Retrospective Modal */}
          <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-zinc-900 border-zinc-800 gap-1.5"
                >
                  <RefreshCcw className="h-3.5 w-3.5 text-sky-400" />
                  New Retro / Note
                </Button>
              }
            />
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  Add Weekly Retrospective or Note
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Shared notes are visible to both teammates; private notes are restricted via Supabase RLS.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateNote} className="space-y-4">
                <input type="hidden" name="teamId" value={teamId} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Type</Label>
                    <select
                      name="noteType"
                      defaultValue="retrospective"
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value="retrospective">Weekly Retrospective</option>
                      <option value="meeting_agenda">Meeting Agenda</option>
                      <option value="general">Technical Note</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Visibility</Label>
                    <select
                      name="visibility"
                      defaultValue="shared"
                      className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value="shared">Shared with Squad</option>
                      <option value="private">Private (Only Me)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Title *</Label>
                  <Input
                    name="title"
                    placeholder="e.g., Week 2 Retrospective: RAG Evaluation Learnings"
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Content *</Label>
                  <Textarea
                    name="content"
                    rows={6}
                    required
                    defaultValue={`### What We Completed\n- \n\n### What We Struggled With\n- \n\n### What Changes Next Week\n- `}
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNoteOpen(false)}
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
                    Save Note
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Log ADR Modal */}
          <Dialog open={adrOpen} onOpenChange={setAdrOpen}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Architecture Decision (ADR)
                </Button>
              }
            />
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  Record Architecture Decision (ADR)
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Document why you chose an approach, what you rejected, and what would cause you to re-architect it.
                </DialogDescription>
              </DialogHeader>

              <form action={handleCreateAdr} className="space-y-3.5">
                <input type="hidden" name="teamId" value={teamId} />
                {errorMsg && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">
                    1. Decision Title *
                  </Label>
                  <Input
                    name="title"
                    placeholder="e.g., ADR-002: Hybrid BM25 + pgvector over pure dense embeddings"
                    required
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">
                    2. Alternatives Considered *
                  </Label>
                  <Textarea
                    name="alternativesConsidered"
                    rows={2}
                    required
                    placeholder="What other databases, models, or architectures did we evaluate?"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-emerald-400">
                    3. Engineering Rationale (Why this won) *
                  </Label>
                  <Textarea
                    name="rationale"
                    rows={3}
                    required
                    placeholder="Why is this the best fit for our latency, accuracy, or security constraints?"
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-amber-400">
                    4. Disadvantages & Trade-offs Accepted *
                  </Label>
                  <Textarea
                    name="tradeoffs"
                    rows={2}
                    required
                    placeholder="Every engineering decision has a downside. What are we sacrificing?"
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-sky-400">
                    5. Conditions That Would Cause Us to Reconsider *
                  </Label>
                  <Textarea
                    name="reconsiderConditions"
                    rows={2}
                    required
                    placeholder="e.g., If corpus exceeds 5M chunks or p95 query latency crosses 150ms..."
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdrOpen(false)}
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
                    Commit Decision Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs: Architecture Decisions Log vs. Weekly Retrospectives & Notes */}
      <Tabs defaultValue="adrs" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto">
          <TabsTrigger
            value="adrs"
            className="text-xs font-mono data-active:bg-emerald-600 data-active:text-zinc-950 data-active:font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-zinc-950 data-[state=active]:font-bold px-3 py-1.5 gap-1.5"
          >
            <Scale className="h-3.5 w-3.5" />
            Architecture Decisions Log ({decisions.length})
          </TabsTrigger>
          <TabsTrigger
            value="retros"
            className="text-xs font-mono data-active:bg-emerald-600 data-active:text-zinc-950 data-active:font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-zinc-950 data-[state=active]:font-bold px-3 py-1.5 gap-1.5"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            Weekly Retrospectives & Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adrs" className="space-y-4">
          {decisions.length === 0 ? (
            <Card className="bg-zinc-900/60 border-zinc-800 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-200">
                No Architecture Decision Records (ADRs) Logged Yet
              </p>
              <p className="text-xs text-zinc-400">
                Click &ldquo;Log Architecture Decision&rdquo; above to document your technical trade-offs.
              </p>
            </Card>
          ) : (
            decisions.map((adr) => (
              <Card
                key={adr.id}
                className="bg-zinc-900/70 border-zinc-800/90 overflow-hidden"
              >
                <CardHeader className="pb-3 border-b border-zinc-800/70 bg-zinc-950/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-emerald-400" />
                      <CardTitle className="text-sm font-bold text-zinc-100">
                        {adr.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span>Logged by {getAuthorName(adr.author_id)}</span>
                      <span>·</span>
                      <span>{new Date(adr.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                      Alternatives Considered
                    </span>
                    <p className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                      {adr.alternatives_considered}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                      Why We Chose This Option (Rationale)
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {adr.rationale}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-950/15 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-amber-400 block">
                      Disadvantages & Trade-Offs Accepted
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {adr.tradeoffs}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-950/15 border border-sky-500/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-sky-400 block">
                      When We Would Reconsider / Re-Architect
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">
                      {adr.reconsider_conditions}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="retros" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {notes.length === 0 ? (
            <Card className="col-span-full bg-zinc-900/60 border-zinc-800 p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-200">
                No Retrospectives or Notes Logged Yet
              </p>
              <p className="text-xs text-zinc-400">
                Click &ldquo;New Retro / Note&rdquo; above to record your weekly retrospective.
              </p>
            </Card>
          ) : (
            notes.map((note) => (
              <Card key={note.id} className="bg-zinc-900/70 border-zinc-800/90">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono uppercase border-zinc-700 text-zinc-300"
                      >
                        {note.note_type.replace('_', ' ')}
                      </Badge>
                      {!note.is_shared ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-amber-500/30 text-amber-300 flex items-center gap-1"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          Private
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-emerald-500/30 text-emerald-300 flex items-center gap-1"
                        >
                          <Users2 className="h-2.5 w-2.5" />
                          Shared
                        </Badge>
                      )}
                    </div>

                    {note.author_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-6 px-1.5 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-sm font-bold text-zinc-100 pt-1">
                    {note.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    By {getAuthorName(note.author_id)} ·{' '}
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
