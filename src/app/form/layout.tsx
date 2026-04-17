import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | FormFlow',
    default: 'FormFlow',
  },
  description: 'Submit your form response',
}

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Minimal header */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-xs font-bold text-white shadow-sm">
              F
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-800">
              FormFlow
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-slate-500 sm:px-6">
          Powered by <span className="font-medium text-slate-700">FormFlow</span>
        </div>
      </footer>
    </div>
  )
}
