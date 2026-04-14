import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'

export default async function ReviewerPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'reviewer') {
    redirect('/admin')
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
          Reviewer Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Welcome back, {session.user.name ?? 'Reviewer'}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Your reviewer route is protected and reachable after login. We will build the full review
          workspace in the next layout session.
        </p>
      </div>
    </main>
  )
}
