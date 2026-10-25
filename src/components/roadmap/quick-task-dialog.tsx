'use client';

import { useState, useTransition } from 'react';
import { createQuickWeekTask } from '@/lib/actions/roadmap';
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
import type { Profile } from '@/types/database';

interface QuickTaskDialogProps {
  teamId: string;
  weekId: string;
  weekNumber: number;
  teammates: Profile[];
}

export function QuickTaskDialog({
  teamId,
  weekId,
  weekNumber,
  teammates,
}: QuickTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      const res = await createQuickWeekTask(formData);
      if (res?.success) {
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
            className="h-8 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Week {weekNumber} Task
          </Button>
        }
      />
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Assign Week {weekNumber} Task
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            This task will automatically link to Week {weekNumber} and appear on the Kanban board.
          </DialogDescription>
        </DialogHeader>

        <form action={handleAction} className="space-y-4 pt-2">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="weekId" value={weekId} />
          <input type="hidden" name="weekNumber" value={weekNumber} />

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs text-zinc-300">
              Task Title
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Implement hybrid BM25 + pgvector retrieval endpoint"
              required
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ownerId" className="text-xs text-zinc-300">
                Owner
              </Label>
              <select
                id="ownerId"
                name="ownerId"
                defaultValue="shared"
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="shared">Joint / Shared Deliverable</option>
                {teammates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name} (Individual)
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
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs text-zinc-300">
              Scope / Acceptance Note
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What must be verified before marking this task Done?"
              className="bg-zinc-950 border-zinc-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
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
