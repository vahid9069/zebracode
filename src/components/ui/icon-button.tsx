import * as React from "react"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  "aria-label": string
  size?: "sm" | "md"
}

export function IconButton({ className, size = "md", ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
      {...props}
    />
  )
}
