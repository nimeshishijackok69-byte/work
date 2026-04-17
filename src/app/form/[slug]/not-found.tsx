import Link from 'next/link'

export default function FormNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-slate-100">
        <span className="text-2xl">🔍</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Form not found</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        The form you're looking for doesn't exist or the link may be incorrect.
        Please check the link and try again.
      </p>
      <Link
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
        href="/"
      >
        Go to homepage
      </Link>
    </div>
  )
}
