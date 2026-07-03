import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import AppSidebar from "@/components/custom/AppSidebar"
import PageHeader from "@/components/custom/PageHeader"
import { Button } from "@/components/ui/button"

export default function Page() {
  // Mock user data - replace with actual user data from your auth system
  const mockUser = {
    name: "John Driver",
    email: "john@cityride.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
  }

  return (
    <SidebarProvider>
      <AppSidebar user={mockUser} />
      <SidebarInset className="flex flex-col">
        <PageHeader />
        <main className="flex-1 p-6">
          <div className="flex max-w-2xl flex-col gap-4">
            <div>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage your rides, vehicles, and customer reservations from here.
              </p>
            </div>
            <Button className="w-fit">Get Started</Button>
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-card-foreground">
                Your sidebar is now set up with navigation links for Home, Customers, Reservations, and My Vehicles.
              </p>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              (Press <kbd>d</kbd> to toggle dark mode)
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
