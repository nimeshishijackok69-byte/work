import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
          Admin Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Welcome back, {session.user.name ?? 'Admin'}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Your authenticated admin shell is in place. The full sidebar and dashboard layout come in
          the next session.
        </p>
      </div>
    </main>
  )
}
