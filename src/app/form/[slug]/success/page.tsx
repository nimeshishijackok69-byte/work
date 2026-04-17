import Link from 'next/link'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; title?: string }>
}) {
  const { ref, title } = await searchParams
  const reference = ref ?? '—'
  const eventTitle = title ?? 'your form'

  return (
    <div className="flex flex-col items-center py-16 text-center">
      {/* Success icon */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-green-200">
        <svg
          className="size-10 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Submission received!
      </h1>

      <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
        Your response for <span className="font-semibold text-slate-800">{decodeURIComponent(eventTitle)}</span> has
        been submitted successfully.
      </p>

      {/* Reference card */}
      <div className="mt-8 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Reference
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-slate-900">
          {reference}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          A confirmation email has been sent to you. Keep this reference for your records.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          href="/"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  )
}
