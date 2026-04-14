'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction, type LoginFormState } from './actions'

const initialState: LoginFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button className="h-11 w-full text-sm font-semibold" disabled={pending} type="submit">
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  )
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null
  }

  return <p className="text-sm text-destructive">{errors[0]}</p>
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const formState = state ?? initialState

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-sm font-medium text-primary shadow-sm backdrop-blur">
          <ShieldCheck className="size-4" />
          Secure access for admins and reviewers
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
            FormFlow
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Sign in to manage events, submissions, and review workflows.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            This workspace is set up for role-based access. Admins manage events and reviewers,
            while reviewers focus only on assigned evaluations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Admin</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create events, publish forms, manage reviewers, and monitor progress.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Reviewer</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review assigned submissions with the right permissions and clear next steps.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-white/80 bg-white/92 shadow-xl shadow-indigo-950/10 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Use your email and password to access the correct dashboard for your role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
              />
              <FieldError errors={formState.errors?.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="Enter your password"
                type="password"
              />
              <FieldError errors={formState.errors?.password} />
            </div>

            {formState.message ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formState.message}
              </div>
            ) : null}

            <SubmitButton />

            <p className="text-sm leading-6 text-slate-500">
              Need initial access? Bootstrap the first admin account through the registration API,
              then sign in here.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
