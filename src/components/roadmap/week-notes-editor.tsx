'use client';

import { useState, useTransition } from 'react';
import { updateWeekNotes } from '@/lib/actions/roadmap';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2, Save } from 'lucide-react';

interface WeekNotesEditorProps {
  weekId: string;
  weekNumber: number;
  initialNotes: string | null;
}

export function WeekNotesEditor({
  weekId,
  weekNumber,
  initialNotes,
}: WeekNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      await updateWeekNotes(weekId, notes, weekNumber);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Record key takeaways, failure cases discovered during testing, benchmark numbers, or architectural lessons learned this week..."
        rows={6}
        className="bg-zinc-950/90 border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed focus-visible:ring-emerald-500/40"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">
          Shared across your team workspace.
        </span>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs gap-1.5 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
