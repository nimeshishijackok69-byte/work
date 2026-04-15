import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DragHandle({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <button
      aria-label="Drag to reorder"
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900',
        className
      )}
      type="button"
      {...props}
    >
      <GripVertical className="size-4" />
    </button>
  )
}
