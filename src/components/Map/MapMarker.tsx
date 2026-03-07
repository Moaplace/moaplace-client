import { memo } from "react"

import MapPin from "@/components/Map/MapPin"
import PulseMarker from "@/components/Map/PulseMarker"
import { cn } from "@/lib/utils"

interface MapMarkerProps {
  type: "mine" | "others" | "center"
  nickname?: string
  x: number
  y: number
}

const MapMarker = memo(({ type, nickname, x, y }: MapMarkerProps) => {
  if (type === "center") {
    return (
      <div
        className={cn("absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none")}
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <PulseMarker color="center" size="lg" label="중간지점" />
      </div>
    )
  }

  return (
    <div
      className={cn("absolute -translate-x-1/2 -translate-y-full pointer-events-none")}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <MapPin type={type} nickname={nickname} />
    </div>
  )
})

MapMarker.displayName = "MapMarker"

export default MapMarker
