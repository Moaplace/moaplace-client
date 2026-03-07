import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

const ErrorState = ({ message = "문제가 생겼어요", onRetry, className }: ErrorStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12 text-center", className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-error/10">
        <AlertTriangle className="size-8 text-error" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-pretendard-sb text-black-800">{message}</p>
        <p className="text-xs text-black-400">잠시 후 다시 시도해볼게요</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  )
}

export default ErrorState
