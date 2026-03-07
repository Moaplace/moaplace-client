import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gradient-to-r from-black-100 via-surface to-black-100 bg-[length:200%_100%] animate-pulse rounded-xl", className)}
      {...props}
    />
  )
}

export { Skeleton }
