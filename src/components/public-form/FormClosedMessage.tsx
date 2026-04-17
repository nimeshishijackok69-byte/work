export function FormClosedMessage({
  title,
  reason,
}: {
  title: string
  reason: 'closed' | 'expired'
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-50">
        <span className="text-2xl">{reason === 'expired' ? '⏰' : '🔒'}</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        {reason === 'expired'
          ? 'This form has passed its deadline and is no longer accepting submissions.'
          : 'This form has been closed by the administrator and is no longer accepting submissions.'}
      </p>
    </div>
  )
}
