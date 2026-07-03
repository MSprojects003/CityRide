import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export default function CustomersPage() {
  const customers = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", rides: 12 },
    { id: 2, name: "Bob Smith", email: "bob@example.com", rides: 8 },
    { id: 3, name: "Carol White", email: "carol@example.com", rides: 15 },
    { id: 4, name: "David Brown", email: "david@example.com", rides: 5 },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage all your customers and their ride history.
        </p>
        <Button>Add Customer</Button>
      </div>
      
      <div className="rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Total Rides</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email}</td>
                <td className="px-4 py-3 text-sm">{customer.rides}</td>
                <td className="px-4 py-3 text-sm">
                  <Button variant="ghost" size="sm">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
