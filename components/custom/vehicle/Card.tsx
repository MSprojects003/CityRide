'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Users, 
  Fuel, 
  Calendar, 
  Clock,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditVehicle } from '@/components/custom/vehicle/edit'
import { DeleteDialog } from '@/components/custom/vehicle/DeleteDialog'
import { ViewDetails } from '@/components/custom/vehicle/viewdetails'
import { supabase } from '@/lib/supabase/client'

export interface CarData {
  id: string
  name: string
  brand: string
  model: string
  year: number
  pricePerDay: number
  pricePerHour: number
  pricePerMonth?: number
  images: string[] | string
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'
  seats: number
  transmission: 'Automatic' | 'Manual'
  rating: number
  reviews: number
  location: string
  availability: boolean
  features?: string[] | string
  vehicleType?: string
  plate?: string
  plateNumber?: string
  color?: string
  description?: string
  licenseNumber?: string
  licenseExpiry?: string
  insuranceNumber?: string
  insuranceExpiry?: string
  registrationNumber?: string
  registrationExpiry?: string
  licenseDocument?: string
  insuranceDocument?: string
  registrationDocument?: string
  mileage?: string
  engineCapacity?: string
  owner?: string
  ownerContact?: string
  ownerEmail?: string
  insuranceCompany?: string
  lastServiced?: string
  nextService?: string
  condition?: 'Excellent' | 'Good' | 'Fair'
  status?: string
}

interface CarCardProps {
  car: CarData
  onViewDetails?: (carId: string) => void
  onBookNow?: (carId: string) => void
  onEdit?: (car: CarData) => void
  onDelete?: (carId: string) => void
  isAdmin?: boolean
}

// Helper to parse images
const parseImages = (images: any): string[] => {
  if (!images) return []
  if (Array.isArray(images)) return images
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function CarCard({ 
  car, 
  onViewDetails: onViewDetailsProp, 
  onBookNow, 
  onEdit, 
  onDelete,
  isAdmin = true 
}: CarCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const parsedImages = parseImages(car.images)
  const displayImages = parsedImages.length > 0 ? parsedImages.slice(0, 2) : []

  const {
    id,
    name,
    brand,
    model,
    year,
    pricePerDay,
    pricePerHour,
    fuelType,
    seats,
    transmission,
    rating,
    reviews,
    availability,
    plate,
    plateNumber
  } = car

  const handleEdit = () => {
    setIsDropdownOpen(false)
    setShowEditSheet(true)
  }

  const handleDelete = () => {
    setIsDropdownOpen(false)
    setShowDeleteDialog(true)
  }

  const handleViewDetails = () => {
    setIsDropdownOpen(false)
    setShowViewSheet(true)
    onViewDetailsProp?.(id)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_deleted: true })
        .eq('id', id)

      if (error) throw error
      
      onDelete?.(id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateVehicle = (updatedVehicle: any) => {
    onEdit?.(updatedVehicle)
    setShowEditSheet(false)
  }

  const handleEditSheetClose = (open: boolean) => {
    if (!open) {
      setShowEditSheet(false)
    }
  }

  const handleViewSheetClose = (open: boolean) => {
    if (!open) {
      setShowViewSheet(false)
    }
  }

  const handleBookNow = () => {
    onBookNow?.(id)
  }

  const handleEditFromView = (vehicle: CarData) => {
    setShowViewSheet(false)
    setTimeout(() => {
      setShowEditSheet(true)
    }, 300)
  }

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 shadow-md relative">
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[16/10] bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          
          {displayImages.length > 0 ? (
            <>
              <Image
                src={displayImages[0]}
                alt={`${brand} ${model}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Second Image Overlay - shows on hover */}
              {displayImages[1] && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Image
                    src={displayImages[1]}
                    alt={`${brand} ${model} - view 2`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
              <span className="text-gray-400 text-sm">No Images</span>
            </div>
          )}

          {/* Image Count Badge */}
          {parsedImages.length > 2 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-20 backdrop-blur-sm">
              +{parsedImages.length - 2} more
            </div>
          )}

          {/* Availability Badge */}
          <Badge 
            className={`absolute top-3 left-3 z-20 ${
              availability 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {availability ? 'Available' : 'Booked'}
          </Badge>

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">{rating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-gray-500">({reviews || 0})</span>
          </div>

          {/* Three Dots Menu - Top Right */}
          {isAdmin && (
            <div className="absolute top-3 right-3 z-30">
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 bg-white/90 hover:bg-white shadow-md rounded-full backdrop-blur-sm transition-all"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {brand} {model}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleViewDetails} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Vehicle
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Vehicle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Car Name & Brand */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base line-clamp-1">
                  {brand} {model}
                </h3>
                <p className="text-xs text-gray-500">{year} • {name}</p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{seats}</span>
            </div>
            <div className="w-px h-3 bg-gray-300" />
            <div className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              <span>{fuelType}</span>
            </div>
            <div className="w-px h-3 bg-gray-300" />
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{transmission === 'Automatic' ? 'Auto' : 'Manual'}</span>
            </div>
          </div>

          {/* Plate Number */}
          {plateNumber && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                {plateNumber}
              </span>
            </div>
          )}

          {/* Pricing */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-lg font-bold text-blue-600">
                  Rs.{pricePerDay.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 ml-1">/day</span>
                <span className="text-xs text-gray-400 mx-2">•</span>
                <span className="text-sm font-medium text-gray-700">
                  Rs.{pricePerHour.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 ml-1">/hr</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                <Clock className="w-3 h-3 mr-1" />
                Instant booking
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Details Sheet */}
      <ViewDetails
        vehicle={car}
        open={showViewSheet}
        onOpenChange={handleViewSheetClose}
        onEdit={handleEditFromView}
        onBookNow={onBookNow}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        vehicleName={name}
        vehicleBrand={brand}
        vehicleModel={model}
        vehiclePlate={plate || plateNumber || ''}
        isLoading={isDeleting}
        deleteType="vehicle"
      />

      {/* Edit Vehicle Sheet */}
      <EditVehicle
        vehicle={car}
        open={showEditSheet}
        onOpenChange={handleEditSheetClose}
        onUpdate={handleUpdateVehicle}
        onDelete={(vehicleId) => {
          onDelete?.(vehicleId)
          setShowEditSheet(false)
        }}
      />
    </>
  )
}