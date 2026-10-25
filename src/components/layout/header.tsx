'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { signOut, updateActiveWeek } from '@/lib/actions/auth';
import {
  Calendar,
  ChevronDown,
  LogOut,
  Plus,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';

interface HeaderProps {
  currentUser: Profile;
  teamId: string;
  teamName: string;
  activeWeek: number;
}

const PHASE_NAMES: Record<number, string> = {
  1: 'LLM Integration & RAG',
  2: 'LLM Integration & RAG',
  3: 'Agents & Tool Calling',
  4: 'Agents & Tool Calling',
  5: 'Deployment, Infra & Security',
  6: 'Deployment, Infra & Security',
  7: 'System Design & AI Arch',
  8: 'System Design & AI Arch',
  9: 'Customer Discovery & Comm',
  10: 'Customer Discovery & Comm',
  11: 'Flagship Project & Interviews',
  12: 'Flagship Project & Interviews',
};

export function Header({
  currentUser,
  teamId,
  teamName,
  activeWeek,
}: HeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleWeekChange = (week: number) => {
    if (week === activeWeek) return;
    startTransition(async () => {
      await updateActiveWeek(teamId, week);
    });
  };

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Team Name & Current Phase Focus */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-zinc-400 hidden sm:inline">
          {teamName}
        </span>
        <span className="text-zinc-700 hidden sm:inline">/</span>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-200">
            Focus: {PHASE_NAMES[activeWeek] ?? 'FDE Curriculum'}
          </span>
        </div>
      </div>

      {/* Right: Week Selector, Quick Task Action, Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Interactive Week X / 12 Badge */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 text-xs font-mono text-zinc-100 gap-2 cursor-pointer'
            )}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            ) : (
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>Week {activeWeek} / 12</span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-zinc-900 border-zinc-800 text-zinc-100 max-h-80 overflow-y-auto"
          >
            <DropdownMenuLabel className="text-[11px] font-mono text-zinc-400">
              Switch Active Curriculum Week
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
              <DropdownMenuItem
                key={week}
                onClick={() => handleWeekChange(week)}
                className="text-xs flex items-center justify-between cursor-pointer focus:bg-zinc-800"
              >
                <div className="flex flex-col">
                  <span className="font-mono font-medium text-zinc-200">
                    Week {week}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {PHASE_NAMES[week]}
                  </span>
                </div>
                {week === activeWeek && (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Navigate to Projects/Tasks */}
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'h-8 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs gap-1.5'
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </Link>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 px-2 hover:bg-zinc-900 text-xs text-zinc-200 gap-2 cursor-pointer'
            )}
          >
            <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-300">
              {currentUser.display_name.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-medium hidden md:inline">
              {currentUser.display_name}
            </span>
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 bg-zinc-900 border-zinc-800 text-zinc-100"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-medium text-zinc-100">
                  {currentUser.full_name}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {currentUser.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
