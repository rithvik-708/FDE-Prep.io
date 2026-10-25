'use client';

import { useState, useTransition } from 'react';
import { signIn, signUp } from '@/lib/actions/auth';
import { Terminal, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('rithvik@iith.ac.in');
  const [password, setPassword] = useState('Rithvik@2006');
  const [fullName, setFullName] = useState('Rithvik Manne');

  async function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      if (mode === 'signin') {
        const result = await signIn(formData);
        if (result?.error) {
          setError(result.error);
        }
      } else {
        const result = await signUp(formData);
        if (result?.error) {
          setError(result.error);
        } else if (result?.message) {
          setMessage(result.message);
          setMode('signin');
        }
      }
    });
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Terminal className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-mono">
              FDE PREP HUB
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              v1.0
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xs">
            Palantir & AI Startup Forward Deployed Engineering Command Centre
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-zinc-900/80 border-zinc-800/80 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-zinc-100">
                {mode === 'signin' ? 'Operator Authentication' : 'Create Squad Account'}
              </CardTitle>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setMessage(null);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-emerald-600 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setMessage(null);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-emerald-600 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              {mode === 'signin'
                ? 'Sign in with your squad credentials to access the workspace.'
                : 'Register a new operator profile connected to your squad.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs text-zinc-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Rithvik Manne"
                    required
                    className="bg-zinc-950/90 border-zinc-800 text-zinc-100 text-sm focus-visible:ring-emerald-500/50"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-zinc-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rithvik@iith.ac.in"
                  required
                  autoComplete="email"
                  className="bg-zinc-950/90 border-zinc-800 text-zinc-100 text-sm focus-visible:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="bg-zinc-950/90 border-zinc-800 text-zinc-100 text-sm focus-visible:ring-emerald-500/50"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold text-xs h-10 transition-colors cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Enter Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Squad Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Security Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
          <span>Protected by Supabase Row-Level Security (RLS)</span>
        </div>
      </div>
    </div>
  );
}
