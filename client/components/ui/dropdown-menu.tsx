import * as React from "react"
import { cn } from "@/lib/utils"

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>
}

export function DropdownMenuTrigger({ children, asChild = false }: { children: React.ReactNode; asChild?: boolean }) {
  return asChild ? children : <button>{children}</button>
}

export function DropdownMenuContent({ children, align = "start", className }: { children: React.ReactNode; align?: "start" | "end"; className?: string }) {
  return <div className={cn("absolute z-10 mt-2 min-w-[180px] bg-white border border-(--color-mint) rounded-lg shadow-lg p-2", className)}>{children}</div>
}

export function DropdownMenuItem({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-2 rounded hover:bg-(--color-mint)/10 cursor-pointer", className)} {...props}>{children}</div>
}
