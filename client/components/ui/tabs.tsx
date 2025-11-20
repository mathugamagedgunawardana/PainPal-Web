import * as React from "react"
import { cn } from "@/lib/utils"

export function Tabs({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full", className)} {...props}>{children}</div>
}

export function TabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex gap-2 p-1 bg-(--color-soft-blue) rounded-lg", className)} {...props}>{children}</div>
}

export function TabsTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("px-4 py-2 rounded-lg text-(--color-blue) font-medium hover:bg-(--color-mint)/10 transition", className)} {...props}>{children}</button>
}

export function TabsContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-2", className)} {...props}>{children}</div>
}
