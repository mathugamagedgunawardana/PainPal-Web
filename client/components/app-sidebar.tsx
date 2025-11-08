"use client"

import * as React from "react"
import {
  IconBrain,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconCalendar,
  IconUsers,
  IconPill,
  IconHelp,
  IconReport,
  IconSearch,
  IconSettings,
  IconAlertTriangle,
  IconStethoscope,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Dr. Sarah Johnson",
    email: "dr.johnson@migrainecare.com",
    avatar: "/avatars/doctor.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/doctor/overview",
      icon: IconDashboard,
    },
    {
      title: "Patients",
      url: "/doctor/patients",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "/doctor/analytics", 
      icon: IconChartBar,
    },
    {
      title: "Risk Assessment",
      url: "/doctor/risk",
      icon: IconAlertTriangle,
    },
    {
      title: "Treatment Plans",
      url: "/doctor/treatments",
      icon: IconStethoscope,
    },
  ],
  navClouds: [
    {
      title: "Patient Records",
      icon: IconFileDescription,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Cases",
          url: "#",
        },
        {
          title: "Treatment History", 
          url: "#",
        },
      ],
    },
    {
      title: "Migraine Episodes",
      icon: IconBrain,
      url: "#",
      items: [
        {
          title: "Recent Episodes",
          url: "#",
        },
        {
          title: "Episode Analysis",
          url: "#",
        },
      ],
    },
    {
      title: "Medication Tracking",
      icon: IconPill,
      url: "#", 
      items: [
        {
          title: "Current Prescriptions",
          url: "#",
        },
        {
          title: "Adherence Monitoring",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search Patients",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Patient Database",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Clinical Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "AI Predictions",
      url: "#",
      icon: IconFileAi,
    },
    {
      name: "Appointment Calendar",
      url: "#",
      icon: IconCalendar,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/doctor/overview">
                <IconBrain className="size-5!" />
                <span className="text-base font-semibold">MigraineCare</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
