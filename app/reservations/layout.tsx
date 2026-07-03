import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import AppSidebar from "@/components/custom/AppSidebar"
import PageHeader from "@/components/custom/PageHeader"

const mockUser = {
  name: "John Driver",
  email: "john@cityride.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
}

export default function ReservationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={mockUser} />
      <SidebarInset className="flex flex-col">
        <PageHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
