import { MapPin as MapPinIcon, Star, Navigation } from "lucide-react"

import { cn } from "@/lib/utils"

interface MapPinProps {
  type: "mine" | "others" | "center"
  nickname?: string
  className?: string
  animate?: boolean
}

const pinStyles = {
  mine: "bg-sub text-white shadow-sub/30",
  others: "bg-primary text-white shadow-primary/30",
  center: "bg-center text-white shadow-center/30",
} as const

const pinIcons = {
  mine: Navigation,
  others: MapPinIcon,
  center: Star,
} as const

const MapPin = ({ type, nickname, className, animate = true }: MapPinProps) => {
  const Icon = pinIcons[type]

  return (
    <div className={cn("flex flex-col items-center gap-1", animate && "animate-pin-drop", className)}>
      {nickname && (
        <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-pretendard-md text-black-800 shadow-sm backdrop-blur-sm">
          {nickname}
        </span>
      )}
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
        pinStyles[type]
      )}>
        <Icon className="size-5" />
      </div>
      <div className={cn(
        "size-2 rounded-full -mt-1",
        type === "mine" && "bg-sub",
        type === "others" && "bg-primary",
        type === "center" && "bg-center",
      )} />
    </div>
  )
}

export default MapPin
