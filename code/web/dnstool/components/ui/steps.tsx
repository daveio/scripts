import { cn } from '@/lib/utils'
import * as React from 'react'

const Steps = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />
))
Steps.displayName = 'Steps'

const Step = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex gap-4', className)} {...props} />
))
Step.displayName = 'Step'

const StepIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-full border border-primary bg-background',
        className
      )}
      {...props}
    />
  )
)
StepIndicator.displayName = 'StepIndicator'

const StepStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    complete?: React.ReactNode
    incomplete?: React.ReactNode
  }
>(({ className, complete, incomplete, ...props }, ref) => (
  <div ref={ref} className={cn('text-primary', className)} {...props}>
    {complete || incomplete}
  </div>
))
StepStatus.displayName = 'StepStatus'

const StepSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('ms-3 h-[calc(100%-0.5rem)] w-px bg-border', className)} {...props} />
  )
)
StepSeparator.displayName = 'StepSeparator'

const StepTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-base font-medium', className)} {...props} />
)
StepTitle.displayName = 'StepTitle'

const StepDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
StepDescription.displayName = 'StepDescription'

export { Steps, Step, StepIndicator, StepStatus, StepSeparator, StepTitle, StepDescription }
