'use client'

import React, { useState, useEffect } from 'react'
import { CarCard, CarData } from './Card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CarListProps {
  onViewDetails?: (carId: string) => void
  onBookNow?: (carId: string) => void
  vendorId?: string
}

export function CarList({ 
  onViewDetails, 
  onBookNow,
  vendorId 
}: CarListProps) {
  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('price-low')
  const [error, setError] = useState<string | null>(null)

  // Fetch vehicles from Supabase
  useEffect(() => {
    fetchVehicles()
  }, [vendorId])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('is_deleted', false)
        .eq('status', 'active')

      if (vendorId) {
        query = query.eq('vendor_id', vendorId)
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Transform the data to match CarData interface
      const transformedData: CarData[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name || `${item.brand} ${item.model}`,
        brand: item.brand || '',
        model: item.model || '',
        year: item.year || 0,
        pricePerDay: parseFloat(item.price_per_day) || 0,
        pricePerHour: parseFloat(item.price_per_hour) || 0,
        pricePerMonth: item.price_per_month ? parseFloat(item.price_per_month) : undefined,
        images: Array.isArray(item.images) ? item.images : 
               typeof item.images === 'string' ? JSON.parse(item.images || '[]') : [],
        fuelType: item.fuel_type || 'Petrol',
        seats: item.seats || 5,
        transmission: item.transmission || 'Automatic',
        rating: parseFloat(item.rating) || 4.0,
        reviews: item.reviews || 0,
        location: item.location || 'Colombo',
        availability: item.availability ?? true,
        features: Array.isArray(item.features) ? item.features :
                  typeof item.features === 'string' ? JSON.parse(item.features || '[]') : [],
        vehicleType: item.vehicle_type || 'car',
        plate: item.plate || item.plate_number || '',
        plateNumber: item.plate_number || '',
        color: item.color || '',
        description: item.description || '',
        licenseNumber: item.license_number || '',
        licenseExpiry: item.license_expiry || '',
        insuranceNumber: item.insurance_number || '',
        insuranceExpiry: item.insurance_expiry || '',
        registrationNumber: item.registration_number || '',
        registrationExpiry: item.registration_expiry || '',
        licenseDocument: item.license_document || '',
        insuranceDocument: item.insurance_document || '',
        registrationDocument: item.registration_document || '',
        status: item.status || 'active'
      }))

      setCars(transformedData)
    } catch (err: any) {
      console.error('Error fetching vehicles:', err)
      setError(err.message || 'Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort cars
  const filteredCars = cars
    .filter(car => {
      const matchesSearch = 
        car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (car.plateNumber && car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'available' && car.availability) ||
                           (filterType === 'electric' && car.fuelType === 'Electric') ||
                           (filterType === 'luxury' && car.pricePerDay > 15000)
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'price-low':
          return a.pricePerDay - b.pricePerDay
        case 'price-high':
          return b.pricePerDay - a.pricePerDay
        case 'rating':
          return b.rating - a.rating
        case 'year-new':
          return b.year - a.year
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={fetchVehicles}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Available Cars
            </h2>
            <p className="text-sm text-gray-500">
              {filteredCars.length} cars available for rent
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by brand, model, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Cars" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cars</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
              <SelectItem value="luxury">Luxury (15k+)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Price: Low to High" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="year-new">Year: Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid Layout - 4 cards per row on desktop */}
      {filteredCars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onViewDetails={onViewDetails}
              onBookNow={onBookNow}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-gray-500">No cars found matching your criteria</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm('')
              setFilterType('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}