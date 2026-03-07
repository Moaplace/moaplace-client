import { MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12 text-center", className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-surface">
        {icon || <MapPin className="size-8 text-black-400" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-pretendard-sb text-black-800">{title}</p>
        {description && <p className="text-xs text-black-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default EmptyState
