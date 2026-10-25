'use client';

import { useState, useTransition } from 'react';
import { upsertResourceProgress } from '@/lib/actions/resources';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  MessageSquareText,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  Profile,
  ResourceStatus,
  ResourceWithProgress,
  RoadmapWeek,
} from '@/types/database';

interface ResourceHubProps {
  resources: ResourceWithProgress[];
  teammates: Profile[];
  weeks: Pick<RoadmapWeek, 'id' | 'week_number' | 'title'>[];
  currentUserId: string;
}

const STATUS_BADGE: Record<
  ResourceStatus,
  { label: string; style: string }
> = {
  not_started: {
    label: 'Not Started',
    style: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  },
  in_progress: {
    label: 'In Progress',
    style: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  reviewed: {
    label: 'Reviewed ✓',
    style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
};

export function ResourceHub({
  resources,
  teammates,
  weeks,
  currentUserId,
}: ResourceHubProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');
  const [activeNoteResource, setActiveNoteResource] =
    useState<ResourceWithProgress | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isPending, startTransition] = useTransition();

  const categories = Array.from(new Set(resources.map((r) => r.category)));

  const getUserStatus = (
    res: ResourceWithProgress,
    userId: string
  ): ResourceStatus => {
    const entry = res.progress?.find((p) => p.user_id === userId);
    return entry?.status ?? 'not_started';
  };

  const getUserNotes = (res: ResourceWithProgress, userId: string): string => {
    const entry = res.progress?.find((p) => p.user_id === userId);
    return entry?.personal_notes ?? '';
  };

  const filteredResources = resources.filter((res) => {
    const myStatus = getUserStatus(res, currentUserId);
    const matchesSearch =
      res.title.toLowerCase().includes(search.toLowerCase()) ||
      res.why_studying.toLowerCase().includes(search.toLowerCase()) ||
      res.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || res.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || myStatus === statusFilter;
    const matchesWeek = weekFilter === 'all' || res.week_id === weekFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesWeek;
  });

  const handleStatusChange = (
    resourceId: string,
    nextStatus: ResourceStatus
  ) => {
    startTransition(async () => {
      await upsertResourceProgress(resourceId, nextStatus);
    });
  };

  const openNotesModal = (res: ResourceWithProgress) => {
    setActiveNoteResource(res);
    setNoteDraft(getUserNotes(res, currentUserId));
  };

  const handleSaveNotes = () => {
    if (!activeNoteResource) return;
    const currentStatus = getUserStatus(activeNoteResource, currentUserId);
    startTransition(async () => {
      await upsertResourceProgress(
        activeNoteResource.id,
        currentStatus,
        noteDraft
      );
      setActiveNoteResource(null);
    });
  };

  return (
    <div className="space-y-5">
      {/* Search & Multi-Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80">
        <div className="md:col-span-5 relative">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, topics, or 'why studying'..."
            className="pl-8 h-8 bg-zinc-950 border-zinc-800 text-xs"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">My Status: All</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="reviewed">Reviewed ✓</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="w-full h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Weeks</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.week_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredResources.map((res) => {
          const myStatus = getUserStatus(res, currentUserId);
          const weekNum = weeks.find((w) => w.id === res.week_id)?.week_number;

          return (
            <div
              key={res.id}
              className={cn(
                'p-4 rounded-xl border transition-all flex flex-col justify-between gap-4',
                myStatus === 'reviewed'
                  ? 'bg-zinc-900/40 border-emerald-500/30'
                  : 'bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700'
              )}
            >
              <div className="space-y-3">
                {/* Badges Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-zinc-950 border-zinc-700 text-zinc-300"
                    >
                      {res.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-zinc-800 text-zinc-400"
                    >
                      {res.resource_type}
                    </Badge>
                    {weekNum && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        Week {weekNum}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    Priority: <strong className="text-zinc-200">{res.priority}</strong>
                  </span>
                </div>

                {/* Title & External Link */}
                <div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-zinc-100 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>{res.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  </a>
                </div>

                {/* Crucial Field: "Why are we studying this?" */}
                <div className="p-3 rounded-lg bg-zinc-950/90 border-l-2 border-emerald-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    <span>Why are we studying this?</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {res.why_studying}
                  </p>
                </div>
              </div>

              {/* Footer: Squad Progress Badges + Personal Controls */}
              <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                {/* Per-User Progress Comparison */}
                <div className="flex items-center gap-2">
                  {teammates.map((member) => {
                    const st = getUserStatus(res, member.id);
                    const badgeInfo = STATUS_BADGE[st];
                    return (
                      <div
                        key={member.id}
                        className={cn(
                          'px-2 py-1 rounded border text-[10px] font-mono flex items-center gap-1.5',
                          badgeInfo.style
                        )}
                      >
                        <span className="font-bold">{member.display_name}:</span>
                        <span>{badgeInfo.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Action Controls for Current User */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openNotesModal(res)}
                    className="h-7 px-2.5 text-xs bg-zinc-950 border-zinc-800 text-zinc-300 gap-1 cursor-pointer"
                  >
                    <MessageSquareText className="h-3 w-3 text-emerald-400" />
                    <span>Takeaways</span>
                  </Button>

                  <select
                    value={myStatus}
                    disabled={isPending}
                    onChange={(e) =>
                      handleStatusChange(
                        res.id,
                        e.target.value as ResourceStatus
                      )
                    }
                    className="h-7 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs font-mono text-zinc-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="reviewed">Reviewed ✓</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Personal Takeaways & Teammate Notes Modal */}
      <Dialog
        open={!!activeNoteResource}
        onOpenChange={(o) => !o && setActiveNoteResource(null)}
      >
        {activeNoteResource && (
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                {activeNoteResource.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Record your key architectural takeaways and inspect your teammate&apos;s notes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase text-emerald-400">
                  Your Personal Takeaways
                </span>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={5}
                  placeholder="What did you learn that we can apply directly to our flagship project or cite in an interview?"
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                />
              </div>

              {/* Show Teammate's Notes if Present */}
              {teammates
                .filter((m) => m.id !== currentUserId)
                .map((teammate) => {
                  const peerNote = getUserNotes(activeNoteResource, teammate.id);
                  return (
                    <div
                      key={teammate.id}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1"
                    >
                      <span className="text-[10px] font-mono uppercase text-zinc-400">
                        {teammate.display_name}&apos;s Takeaways:
                      </span>
                      <p className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                        {peerNote || 'No notes recorded yet.'}
                      </p>
                    </div>
                  );
                })}

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveNoteResource(null)}
                  className="text-xs cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Takeaways
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
