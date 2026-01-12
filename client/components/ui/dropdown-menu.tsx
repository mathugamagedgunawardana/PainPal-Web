import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)

function useDropdownContext() {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) throw new Error("DropdownMenu components must be used within DropdownMenu")
  return ctx
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild = false, className }: { children: React.ReactNode; asChild?: boolean; className?: string }) {
  const { setOpen, open } = useDropdownContext()
  const toggle = () => setOpen(!open)

  if (asChild) {
    const child = children as React.ReactElement
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        toggle()
      },
    })
  }

  return (
    <button className={className} onClick={toggle}>
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, align = "start", className }: { children: React.ReactNode; align?: "start" | "end"; className?: string }) {
  const { open } = useDropdownContext()
  if (!open) return null
  const alignment = align === "end" ? "right-0" : "left-0"
  return <div className={cn("absolute z-50 top-full mt-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg p-2", alignment, className)}>{children}</div>
}

export function DropdownMenuItem({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-2 rounded hover:bg-(--color-mint)/10 cursor-pointer", className)} {...props}>{children}</div>
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-4 py-2 text-sm font-medium", className)}>{children}</div>
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-gray-200", className)} />
}
