import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  inputSize?: "default" | "lg"
}

function Input({ className, type, inputSize = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary/20 w-full min-w-0 rounded-md border border-black-300 bg-white shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-pretendard-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] focus-visible:shadow-md",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        inputSize === "lg" ? "h-12 px-4 text-base" : "h-9 px-3 py-1 text-base md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
