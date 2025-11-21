"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
}

const TabsContext = React.createContext<{
  activeTab: string
  setActiveTab: (value: string) => void
}>({ activeTab: '', setActiveTab: () => {} })

export function Tabs({ children, className, defaultValue = '', ...props }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex gap-2 p-1 bg-(--color-soft-blue) rounded-lg", className)} {...props}>
      {children}
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ children, className, value, ...props }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext)
  
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition",
        activeTab === value 
          ? "bg-(--color-mint) text-white" 
          : "text-(--color-blue) hover:bg-(--color-mint)/10",
        className
      )} 
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ children, className, value, ...props }: TabsContentProps) {
  const { activeTab } = React.useContext(TabsContext)
  
  if (activeTab !== value) return null
  
  return (
    <div className={cn("mt-2", className)} {...props}>
      {children}
    </div>
  )
}
