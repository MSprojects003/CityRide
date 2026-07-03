import { Button } from "@/components/ui/button"
import { Car } from "lucide-react"

export default function VehiclesPage() {
  const vehicles = [
    { id: 1, name: "Toyota Prius", plate: "ABC123", status: "Available", year: 2022 },
    { id: 2, name: "Honda Civic", plate: "XYZ789", status: "In Use", year: 2021 },
    { id: 3, name: "Tesla Model 3", plate: "TES456", status: "Available", year: 2023 },
    { id: 4, name: "Ford Focus", plate: "FOR999", status: "Maintenance", year: 2020 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800"
      case "In Use":
        return "bg-blue-100 text-blue-800"
      case "Maintenance":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your vehicle fleet and their status.
        </p>
        <Button>Add Vehicle</Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Vehicles</p>
          <p className="mt-2 text-3xl font-bold">4</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="mt-2 text-3xl font-bold text-green-600">2</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In Use</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">1</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Maintenance</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">1</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Plate</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{vehicle.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{vehicle.plate}</td>
                <td className="px-4 py-3 text-sm">{vehicle.year}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button variant="ghost" size="sm">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
