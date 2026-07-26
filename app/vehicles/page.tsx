'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Car, 
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle
} from "lucide-react"
import { CarList } from "@/components/custom/vehicle/List"
import { Badge } from "@/components/ui/badge"
import { AddVehicle } from "@/components/custom/vehicle/Add"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { vendorApi } from "@/lib/api/vendor"

export default function VehiclesPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, available: 0, inUse: 0, maintenance: 0 })
  const [loading, setLoading] = useState(true)

  // Get vendor ID
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const vendor = await vendorApi.getVendorByUserId(user.id)
          if (vendor) {
            setVendorId(vendor.id)
          }
        }
      } catch (error) {
        console.error('Error fetching vendor:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVendor()
  }, [])

  // Fetch stats
  useEffect(() => {
    if (vendorId) {
      fetchStats()
    }
  }, [vendorId])

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('status, availability')
        .eq('vendor_id', vendorId)
        .eq('is_deleted', false)

      if (error) throw error

      const total = data?.length || 0
      const available = data?.filter(v => v.availability === true).length || 0
      const inUse = data?.filter(v => v.availability === false && v.status === 'active').length || 0
      const maintenance = data?.filter(v => v.status === 'maintenance').length || 0

      setStats({ total, available, inUse, maintenance })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Handle car actions
  const handleViewDetails = (carId: string) => {
    console.log("View details for car:", carId)
  }

  const handleBookNow = (carId: string) => {
    console.log("Book car:", carId)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Fleet</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vehicle fleet and their status.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Car className="w-4 h-4" />
            Total Vehicles
          </p>
          <p className="mt-2 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 hover:shadow-md transition-shadow">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Available
          </p>
          <p className="mt-2 text-2xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 hover:shadow-md transition-shadow">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            In Use
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{stats.inUse}</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 hover:shadow-md transition-shadow">
          <p className="text-sm text-orange-700 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Maintenance
          </p>
          <p className="mt-2 text-2xl font-bold text-orange-700">{stats.maintenance}</p>
        </div>
      </div>

      {/* Car List */}
      <CarList 
        vendorId={vendorId || undefined}
        onViewDetails={handleViewDetails}
        onBookNow={handleBookNow}
      />

      {/* Add Vehicle FAB */}
      <AddVehicle />
    </div>
  )
}