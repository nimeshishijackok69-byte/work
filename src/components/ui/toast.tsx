import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const toastVariants = cva(
  'rounded-xl border px-4 py-3 shadow-lg shadow-slate-950/10',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Toast({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof toastVariants>) {
  return <div className={cn(toastVariants({ variant }), className)} {...props} />
}

function ToastTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm font-semibold', className)} {...props} />
}

function ToastDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...props} />
}

export { Toast, ToastTitle, ToastDescription }
