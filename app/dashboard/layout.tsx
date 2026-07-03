'use client'

import { SidebarInset } from "@/components/ui/sidebar"
import PageHeader from "@/components/custom/PageHeader"
import { DashboardLayoutClient } from "./layout-client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutClient>
      <SidebarInset className="flex flex-col">
        <PageHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </DashboardLayoutClient>
  )
}
