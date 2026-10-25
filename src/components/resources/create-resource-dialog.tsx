'use client';

import { useState, useTransition } from 'react';
import { createResource } from '@/lib/actions/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import type { RoadmapWeek } from '@/types/database';

interface CreateResourceDialogProps {
  teamId: string;
  weeks: Pick<RoadmapWeek, 'id' | 'week_number' | 'title'>[];
  activeWeekNumber: number;
}

export function CreateResourceDialog({
  teamId,
  weeks,
  activeWeekNumber,
}: CreateResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultWeekId =
    weeks.find((w) => w.week_number === activeWeekNumber)?.id ?? 'none';

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createResource(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="h-9 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        }
      />

      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Curated Study Resource
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Every link must include a clear engineering purpose to prevent passive tutorial consumption.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="teamId" value={teamId} />

          {error && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs text-zinc-300">
              Resource Title *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Hybrid Search with pgvector and BM25"
              required
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url" className="text-xs text-zinc-300">
              URL *
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://..."
              required
              className="bg-zinc-950 border-zinc-800 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs text-zinc-300">
                Category
              </Label>
              <select
                id="category"
                name="category"
                defaultValue="Applied AI"
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Applied AI">Applied AI & RAG</option>
                <option value="Agents">Agents & Tool Calling</option>
                <option value="System Design">System Design & Ontology</option>
                <option value="AI Infrastructure">AI Infrastructure</option>
                <option value="Job Preparation">Customer Discovery & FDE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resourceType" className="text-xs text-zinc-300">
                Type
              </Label>
              <select
                id="resourceType"
                name="resourceType"
                defaultValue="Documentation"
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Documentation">Documentation</option>
                <option value="Course">Course</option>
                <option value="GitHub Repo">GitHub Repo</option>
                <option value="Article">Engineering Article</option>
                <option value="Paper">Paper</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs text-zinc-300">
                Priority
              </Label>
              <select
                id="priority"
                name="priority"
                defaultValue="high"
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weekId" className="text-xs text-zinc-300">
              Connected Roadmap Week
            </Label>
            <select
              id="weekId"
              name="weekId"
              defaultValue={defaultWeekId}
              className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="none">General Reference</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.week_number}: {w.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="whyStudying"
              className="text-xs font-semibold text-emerald-400"
            >
              Why are we studying this? * (How does it help our project or interviews?)
            </Label>
            <Textarea
              id="whyStudying"
              name="whyStudying"
              required
              rows={3}
              placeholder="e.g., Learn retrieval evaluation metrics so we can explain how we detect and diagnose poor RAG answers in our flagship project."
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs cursor-pointer"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Resource
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
