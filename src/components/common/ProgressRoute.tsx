import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProgressRouteProps {
  steps: string[]
  currentStep: number
  className?: string
}

const ProgressRoute = ({ steps, currentStep, className }: ProgressRouteProps) => {
  return (
    <div className={cn("flex items-center w-full px-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                isCompleted && "bg-primary border-primary text-white",
                isCurrent && "border-primary bg-primary-100 text-primary",
                !isCompleted && !isCurrent && "border-black-300 bg-white text-black-400"
              )}>
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-xs font-pretendard-sb">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-pretendard-md whitespace-nowrap",
                isCompleted && "text-primary",
                isCurrent && "text-primary font-pretendard-sb",
                !isCompleted && !isCurrent && "text-black-400"
              )}>
                {step}
              </span>
            </div>

            {!isLast && (
              <div className="flex-1 mx-2 h-0.5 relative">
                <div className="absolute inset-0 bg-black-300 rounded-full" />
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500",
                    isCompleted ? "w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProgressRoute
