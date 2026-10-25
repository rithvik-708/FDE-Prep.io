'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Library,
  KanbanSquare,
  Mic2,
  Users2,
  Terminal,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/database';

interface SidebarProps {
  currentUser: Profile;
  teammates: Profile[];
  activeWeek: number;
}

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Daily command centre',
  },
  {
    name: 'Roadmap',
    href: '/roadmap',
    icon: Map,
    description: '12-week curriculum spine',
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: Library,
    description: 'Curated study bank',
  },
  {
    name: 'Projects & Tasks',
    href: '/projects',
    icon: KanbanSquare,
    description: 'Kanban & Definition of Done',
  },
  {
    name: 'Interviews',
    href: '/interviews',
    icon: Mic2,
    description: 'Palantir & AI Startup drills',
  },
  {
    name: 'Team Workspace',
    href: '/team',
    icon: Users2,
    description: 'ADRs, retros & agendas',
  },
];

export function Sidebar({ currentUser, teammates, activeWeek }: SidebarProps) {
  const pathname = usePathname();

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Phase mapping helper for the sidebar mini-progress indicator
  const currentPhase = Math.ceil(activeWeek / 2);

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950/90 flex flex-col justify-between select-none min-h-screen">
      {/* Top Section: Brand + Navigation */}
      <div>
        {/* Brand Bar */}
        <div className="h-14 px-4 border-b border-zinc-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/60 transition-colors">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="font-mono font-bold text-sm tracking-tight text-zinc-100">
              FDE PREP HUB
            </span>
          </Link>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            P{currentPhase}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70 border border-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Squad Roster & Streaks */}
      <div className="p-3 border-t border-zinc-800/80 space-y-2.5 bg-zinc-950">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Squad Status
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            {teammates.length} / 2 Active
          </span>
        </div>

        <div className="space-y-1.5">
          {teammates.map((member) => {
            const isMe = member.id === currentUser.id;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between px-2.5 py-2 rounded-md bg-zinc-900/60 border border-zinc-800/70"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-200 shrink-0">
                    {member.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5 truncate">
                      <span>{member.display_name}</span>
                      {isMe && (
                        <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 text-xs font-mono text-amber-400 shrink-0"
                  title={`${member.current_streak} day streak`}
                >
                  <Flame className="h-3.5 w-3.5 fill-amber-400/20" />
                  <span>{member.current_streak}d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
