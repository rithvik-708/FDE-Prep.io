'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/actions/tasks';
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
import type { Profile, RoadmapWeek } from '@/types/database';

interface CreateTaskDialogProps {
  teamId: string;
  teammates: Profile[];
  weeks: Pick<RoadmapWeek, 'id' | 'week_number' | 'title'>[];
  activeWeekNumber: number;
}

export function CreateTaskDialog({
  teamId,
  teammates,
  weeks,
  activeWeekNumber,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultWeekId =
    weeks.find((w) => w.week_number === activeWeekNumber)?.id ?? 'none';

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createTask(formData);
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
            New Engineering Task
          </Button>
        }
      />

      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Create Engineering Task
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Every task requires a strict Definition of Done before it can be closed.
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
              Task Title *
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Implement ACL metadata filtering in pgvector RPC"
              required
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ownerId" className="text-xs text-zinc-300">
                Owner
              </Label>
              <select
                id="ownerId"
                name="ownerId"
                defaultValue="shared"
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="shared">Shared (Team)</option>
                {teammates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                  </option>
                ))}
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

            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-xs text-zinc-300">
                Deadline
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                className="bg-zinc-950 border-zinc-800 text-xs h-9"
              />
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
              <option value="none">General / Unlinked</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.week_number}: {w.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs text-zinc-300">
              Technical Scope & Context
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Brief implementation notes or architecture context..."
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customDod" className="text-xs text-zinc-300">
              Definition of Done Criteria (One per line — leave blank for standard 5-point gate)
            </Label>
            <Textarea
              id="customDod"
              name="customDod"
              rows={4}
              defaultValue={`Endpoint works end-to-end\nInput validation & error handling implemented\nNormal and failure test cases pass\nPeer reviewed by teammate\nDocumentation explains how to run it`}
              className="bg-zinc-950 border-zinc-800 text-xs font-mono"
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
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
