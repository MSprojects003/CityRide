'use client'

import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Car,
  Calendar,
  Users,
  Fuel,
  Gauge,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  FileText,
  Palette,
  Info,
  Sparkles,
  Truck,
  Bike,
  Ship,
  Bus,
  BikeIcon,
  Eye,
  Phone,
  Mail,
  User,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  AlertCircle,
  Shield,
  FileCheck,
  Hash,
  CreditCard,
  Building,
  CalendarDays,
  Wrench,
  Download,
  Printer,
  DownloadIcon
} from 'lucide-react'
import Image from 'next/image'

export interface VehicleDetailsData {
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
  vendor_id?: string
  created_at?: string
  updated_at?: string
}

interface ViewDetailsProps {
  vehicle: VehicleDetailsData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (vehicle: VehicleDetailsData) => void
  onBookNow?: (vehicleId: string) => void
}

const vehicleTypeIcons = {
  car: Car,
  threewheeler: Truck,
  bike: Bike,
  van: Bus,
  bus: Bus,
  boat: Ship,
  bicycle: BikeIcon,
}

const fuelTypeColors = {
  Petrol: 'bg-orange-100 text-orange-800 border-orange-200',
  Diesel: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Electric: 'bg-green-100 text-green-800 border-green-200',
  Hybrid: 'bg-blue-100 text-blue-800 border-blue-200',
  CNG: 'bg-purple-100 text-purple-800 border-purple-200',
}

const conditionColors = {
  Excellent: 'text-green-600 bg-green-50 border-green-200',
  Good: 'text-blue-600 bg-blue-50 border-blue-200',
  Fair: 'text-yellow-600 bg-yellow-50 border-yellow-200',
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

// Helper to parse features
const parseFeatures = (features: any): string[] => {
  if (!features) return []
  if (Array.isArray(features)) return features
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export function ViewDetails({ 
  vehicle, 
  open, 
  onOpenChange,
  onEdit,
  onBookNow
}: ViewDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!vehicle) return null

  const images = parseImages(vehicle.images)
  const features = parseFeatures(vehicle.features)

  const getVehicleTypeIcon = (type: string) => {
    const Icon = vehicleTypeIcons[type as keyof typeof vehicleTypeIcons] || Car
    return Icon
  }

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`
  }

  const getStatusBadge = (availability: boolean) => {
    if (availability) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Available
        </Badge>
      )
    }
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1">
        <XCircle className="w-3 h-3" />
        Booked
      </Badge>
    )
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
  }

  const VehicleTypeIcon = getVehicleTypeIcon(vehicle.vehicleType || '')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:!max-w-[90vw] md:!max-w-[85vw] lg:!max-w-[80vw] xl:!max-w-[75vw] 2xl:!max-w-[70vw] p-0"
      >
        <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Vehicle Details
              </SheetTitle>
              <SheetDescription>
                Complete information about your vehicle
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(vehicle)
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Vehicle
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-6 space-y-6">
            {/* Image Gallery with Navigation */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="aspect-[21/9] relative">
                {images.length > 0 ? (
                  <>
                    <Image
                      src={images[currentImageIndex] || images[0]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-20"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all z-20"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex 
                                  ? 'bg-white w-6' 
                                  : 'bg-white/50 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full z-20 backdrop-blur-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <ImageIcon className="w-16 h-16 text-gray-300 mb-2" />
                    <span className="text-gray-400 text-sm">No images available</span>
                  </div>
                )}
                {/* Image Overlay Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                  {getStatusBadge(vehicle.availability)}
                  <Badge variant="secondary" className="gap-1 bg-white/90 backdrop-blur-sm">
                    <VehicleTypeIcon className="w-3 h-3" />
                    {vehicle.vehicleType || 'Car'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Price per Day</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(vehicle.pricePerDay)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Price per Hour</p>
                  <p className="text-lg font-bold">{formatCurrency(vehicle.pricePerHour)}</p>
                </CardContent>
              </Card>
              {vehicle.pricePerMonth && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Price per Month</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(vehicle.pricePerMonth)}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge className={vehicle.availability ? 'bg-green-500' : 'bg-red-500'}>
                      {vehicle.availability ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Vehicle Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {vehicle.year} • {vehicle.name}
                  </p>
                  {vehicle.description && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {vehicle.description}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{vehicle.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                      <Fuel className="w-4 h-4 text-muted-foreground" />
                      <span>{vehicle.fuelType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                      <Gauge className="w-4 h-4 text-muted-foreground" />
                      <span>{vehicle.transmission}</span>
                    </div>
                    {vehicle.mileage && (
                      <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span>{vehicle.mileage} km/l</span>
                      </div>
                    )}
                    {vehicle.engineCapacity && (
                      <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span>{vehicle.engineCapacity} cc</span>
                      </div>
                    )}
                    {vehicle.color && (
                      <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <span>{vehicle.color}</span>
                      </div>
                    )}
                    {vehicle.plateNumber && (
                      <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg col-span-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono">{vehicle.plateNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {features.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Additional Info */}
              <div className="space-y-4">
                {/* Vehicle Status Card */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Vehicle Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Availability</span>
                        {getStatusBadge(vehicle.availability)}
                      </div>
                      {vehicle.condition && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Condition</span>
                          <Badge className={`${conditionColors[vehicle.condition as keyof typeof conditionColors]}`}>
                            {vehicle.condition}
                          </Badge>
                        </div>
                      )}
                      {vehicle.lastServiced && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Serviced</span>
                          <span className="text-sm">{new Date(vehicle.lastServiced).toLocaleDateString()}</span>
                        </div>
                      )}
                      {vehicle.nextService && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Service</span>
                          <span className="text-sm text-amber-600 font-medium">{new Date(vehicle.nextService).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documents Card */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents
                    </h4>
                    <div className="space-y-3 text-sm">
                      {vehicle.licenseNumber && (
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            License
                          </p>
                          <p className="font-medium">{vehicle.licenseNumber}</p>
                          {vehicle.licenseExpiry && (
                            <p className="text-xs flex items-center gap-1 mt-0.5">
                              <CalendarDays className="w-3 h-3 text-muted-foreground" />
                              Expires: {new Date(vehicle.licenseExpiry).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      {vehicle.insuranceNumber && (
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            Insurance
                          </p>
                          <p className="font-medium">{vehicle.insuranceNumber}</p>
                          {vehicle.insuranceCompany && (
                            <p className="text-xs text-muted-foreground">{vehicle.insuranceCompany}</p>
                          )}
                          {vehicle.insuranceExpiry && (
                            <p className="text-xs flex items-center gap-1 mt-0.5">
                              <CalendarDays className="w-3 h-3 text-muted-foreground" />
                              Expires: {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      {vehicle.registrationNumber && (
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Registration
                          </p>
                          <p className="font-medium">{vehicle.registrationNumber}</p>
                          {vehicle.registrationExpiry && (
                            <p className="text-xs flex items-center gap-1 mt-0.5">
                              <CalendarDays className="w-3 h-3 text-muted-foreground" />
                              Expires: {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Owner Info */}
                {(vehicle.owner || vehicle.ownerContact || vehicle.ownerEmail) && (
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Owner Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        {vehicle.owner && (
                          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{vehicle.owner}</span>
                          </div>
                        )}
                        {vehicle.ownerContact && (
                          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{vehicle.ownerContact}</span>
                          </div>
                        )}
                        {vehicle.ownerEmail && (
                          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate">{vehicle.ownerEmail}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vehicle Info Card */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Vehicle Information
                    </h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle ID</span>
                        <span className="font-mono text-xs">{vehicle.id?.slice(0, 8)}...</span>
                      </div>
                      {vehicle.vehicleType && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span className="capitalize">{vehicle.vehicleType}</span>
                        </div>
                      )}
                      {vehicle.created_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Added</span>
                          <span>{new Date(vehicle.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {vehicle.updated_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Updated</span>
                          <span>{new Date(vehicle.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />
            
            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download Details
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
              {onEdit && (
                <Button 
                  variant="default"
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(vehicle)
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Vehicle
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}