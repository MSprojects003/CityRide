import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Welcome back! Here&apos;s your dashboard overview.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Rides</p>
          <p className="mt-2 text-3xl font-bold">24</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Vehicles</p>
          <p className="mt-2 text-3xl font-bold">5</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending Reservations</p>
          <p className="mt-2 text-3xl font-bold">8</p>
        </div>
      </div>
      <Button className="w-fit">View More Details</Button>
    </div>
  )
}
