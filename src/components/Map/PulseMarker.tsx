import { cn } from "@/lib/utils"

interface PulseMarkerProps {
  color?: "center" | "primary" | "sub"
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

const colorStyles = {
  center: "bg-center",
  primary: "bg-primary",
  sub: "bg-sub",
} as const

const ringStyles = {
  center: "bg-center/30",
  primary: "bg-primary/30",
  sub: "bg-sub/30",
} as const

const sizeStyles = {
  sm: "size-3",
  md: "size-5",
  lg: "size-8",
} as const

const PulseMarker = ({ color = "center", size = "md", label, className }: PulseMarkerProps) => {
  return (
    <div className={cn("relative flex flex-col items-center gap-1", className)}>
      <div className="relative flex items-center justify-center">
        <span className={cn(
          "absolute rounded-full animate-pulse-ring",
          ringStyles[color],
          sizeStyles[size]
        )} />
        <span className={cn(
          "relative rounded-full shadow-lg z-10",
          colorStyles[color],
          sizeStyles[size]
        )} />
      </div>
      {label && (
        <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-pretendard-md text-black-800 shadow-sm backdrop-blur-sm whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}

export default PulseMarker
