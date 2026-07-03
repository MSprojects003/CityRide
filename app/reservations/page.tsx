import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function ReservationsPage() {
  const reservations = [
    { id: 1, customer: "Alice Johnson", vehicle: "Toyota Prius", date: "2024-07-10", status: "Confirmed" },
    { id: 2, customer: "Bob Smith", vehicle: "Honda Civic", date: "2024-07-11", status: "Pending" },
    { id: 3, customer: "Carol White", vehicle: "Tesla Model 3", date: "2024-07-12", status: "Confirmed" },
    { id: 4, customer: "David Brown", vehicle: "Ford Focus", date: "2024-07-15", status: "Cancelled" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          View and manage all customer reservations.
        </p>
        <Button>New Reservation</Button>
      </div>
      
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <tr key={res.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{res.customer}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{res.vehicle}</td>
                <td className="px-4 py-3 text-sm">{res.date}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(res.status)}`}>
                    {res.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button variant="ghost" size="sm">Manage</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
