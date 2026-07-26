'use client'

import React, { useState, useEffect } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Car, 
  Bike, 
  Ship, 
  Bus, 
  Truck, 
  BikeIcon, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Clock,
  Edit,
  X,
  Eye,
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  Lock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

interface VehicleFormData {
  // Vehicle Details
  id: string
  vehicleType: string
  brand: string
  model: string
  year: string
  plateNumber: string
  color: string
  seats: string
  transmission: string
  fuelType: string
  description: string
  
  // Pricing (Editable)
  priceDay: string
  priceHour: string
  priceMonth: string
  pricingTypes: {
    day: boolean
    hour: boolean
    month: boolean
  }
  
  // Documents (All Disabled - Read-only)
  licenseNumber: string
  licenseExpiry: string
  insuranceNumber: string
  insuranceExpiry: string
  registrationNumber: string
  registrationExpiry: string
  
  // Document Uploads (Editable)
  newLicenseDocument: File | null
  newInsuranceDocument: File | null
  newRegistrationDocument: File | null
  existingLicenseDoc?: string
  existingInsuranceDoc?: string
  existingRegistrationDoc?: string
  
  // Existing Images
  existingImages: string[]
  newImages: File[]
  newImageUrls: string[]
  imagesToDelete: string[]
}

interface EditVehicleProps {
  vehicle: any
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onUpdate?: (updatedVehicle: any) => void
  onDelete?: (vehicleId: string) => void
}

const vehicleTypes = [
  { value: 'car', label: 'Car', icon: Car },
  { value: 'threewheeler', label: 'Three Wheeler', icon: Truck },
  { value: 'bike', label: 'Bike', icon: Bike },
  { value: 'van', label: 'Van', icon: Bus },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'boat', label: 'Boat', icon: Ship },
  { value: 'bicycle', label: 'Bicycle', icon: BikeIcon },
]

const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']
const transmissionTypes = ['Automatic', 'Manual']
const MAX_IMAGES = 5

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

export function EditVehicle({ 
  vehicle, 
  open = false, 
  onOpenChange, 
  onUpdate, 
  onDelete 
}: EditVehicleProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    id: '',
    vehicleType: '',
    brand: '',
    model: '',
    year: '',
    plateNumber: '',
    color: '',
    seats: '',
    transmission: '',
    fuelType: '',
    description: '',
    priceDay: '',
    priceHour: '',
    priceMonth: '',
    pricingTypes: { day: true, hour: true, month: false },
    licenseNumber: '',
    licenseExpiry: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    registrationNumber: '',
    registrationExpiry: '',
    newLicenseDocument: null,
    newInsuranceDocument: null,
    newRegistrationDocument: null,
    existingLicenseDoc: '',
    existingInsuranceDoc: '',
    existingRegistrationDoc: '',
    existingImages: [],
    newImages: [],
    newImageUrls: [],
    imagesToDelete: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load vehicle data when opened
  useEffect(() => {
    if (vehicle && open) {
      const parsedImages = parseImages(vehicle.images)
      
      setFormData({
        id: vehicle.id || '',
        vehicleType: vehicle.vehicleType || vehicle.type || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        plateNumber: vehicle.plate || vehicle.plateNumber || '',
        color: vehicle.color || '',
        seats: vehicle.seats?.toString() || '',
        transmission: vehicle.transmission || '',
        fuelType: vehicle.fuelType || '',
        description: vehicle.description || '',
        priceDay: vehicle.pricePerDay?.toString() || '',
        priceHour: vehicle.pricePerHour?.toString() || '',
        priceMonth: vehicle.pricePerMonth?.toString() || '',
        pricingTypes: {
          day: !!vehicle.pricePerDay,
          hour: !!vehicle.pricePerHour,
          month: !!vehicle.pricePerMonth
        },
        licenseNumber: vehicle.licenseNumber || '',
        licenseExpiry: vehicle.licenseExpiry || '',
        insuranceNumber: vehicle.insuranceNumber || '',
        insuranceExpiry: vehicle.insuranceExpiry || '',
        registrationNumber: vehicle.registrationNumber || '',
        registrationExpiry: vehicle.registrationExpiry || '',
        newLicenseDocument: null,
        newInsuranceDocument: null,
        newRegistrationDocument: null,
        existingLicenseDoc: vehicle.licenseDocument || '',
        existingInsuranceDoc: vehicle.insuranceDocument || '',
        existingRegistrationDoc: vehicle.registrationDocument || '',
        existingImages: parsedImages,
        newImages: [],
        newImageUrls: [],
        imagesToDelete: []
      })
      setStep(1)
      setShowDeleteConfirm(false)
      setErrors({})
      setSaveSuccess(false)
    }
  }, [vehicle, open])

  // Handle sheet open/close
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen)
  }

  // Check if documents are expired
  const isDocumentExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    return expiry < today
  }

  const handleInputChange = (field: keyof VehicleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePricingTypeChange = (type: 'day' | 'hour' | 'month', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      pricingTypes: { ...prev.pricingTypes, [type]: checked }
    }))
  }

  const handleFileUpload = (field: 'newLicenseDocument' | 'newInsuranceDocument' | 'newRegistrationDocument', file: File | null) => {
    handleInputChange(field, file)
  }

  const handleNewImageUpload = (files: FileList | null) => {
    if (!files) return

    const maxNewImages = MAX_IMAGES - (formData.existingImages.length - formData.imagesToDelete.length)
    if (maxNewImages <= 0) {
      setErrors(prev => ({
        ...prev,
        images: `Maximum ${MAX_IMAGES} images allowed.`
      }))
      return
    }

    const newImages: File[] = []
    const newImageUrls: string[] = []
    let hasError = false

    Array.from(files).slice(0, maxNewImages).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          images: `Image ${file.name} is too large. Maximum size is 10MB`
        }))
        hasError = true
        return
      }

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          images: `Image ${file.name} is not supported. Please upload JPEG, PNG, or WebP images`
        }))
        hasError = true
        return
      }

      newImages.push(file)
      newImageUrls.push(URL.createObjectURL(file))
    })

    if (!hasError) {
      setFormData(prev => ({
        ...prev,
        newImages: [...prev.newImages, ...newImages],
        newImageUrls: [...prev.newImageUrls, ...newImageUrls]
      }))
      setErrors(prev => ({ ...prev, images: '' }))
    }
  }

  const removeExistingImage = (index: number) => {
    const imageToDelete = formData.existingImages[index]
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
      imagesToDelete: [...prev.imagesToDelete, imageToDelete]
    }))
  }

  const removeNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
      newImageUrls: prev.newImageUrls.filter((_, i) => i !== index)
    }))
  }

  // Auto-save function using onBlur
  const autoSave = async (field: string, value: any) => {
    if (!formData.id) return
    
    setSaving(true)
    setSaveSuccess(false)

    try {
      const updateData: any = {}
      
      const fieldMap: Record<string, string> = {
        color: 'color',
        seats: 'seats',
        description: 'description',
        priceDay: 'price_per_day',
        priceHour: 'price_per_hour',
        priceMonth: 'price_per_month',
        transmission: 'transmission',
        fuelType: 'fuel_type',
        year: 'year',
        plateNumber: 'plate_number'
      }

      const dbField = fieldMap[field]
      if (dbField) {
        if (field === 'seats' || field === 'priceDay' || field === 'priceHour' || field === 'priceMonth') {
          updateData[dbField] = parseInt(value) || 0
        } else if (field === 'year') {
          updateData[dbField] = parseInt(value) || 0
        } else {
          updateData[dbField] = value
        }

        const { error } = await supabase
          .from('vehicles')
          .update(updateData)
          .eq('id', formData.id)

        if (error) throw error

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Error saving field:', error)
      setErrors(prev => ({
        ...prev,
        [field]: 'Failed to save. Please try again.'
      }))
    } finally {
      setSaving(false)
    }
  }

  // Handle checkbox changes - update price to null when unchecked
  const handleCheckboxChange = async (type: 'day' | 'hour' | 'month', checked: boolean) => {
    handlePricingTypeChange(type, checked)
    
    if (formData.id) {
      try {
        const updateData: any = {}
        const fieldMap = {
          day: 'price_per_day',
          hour: 'price_per_hour',
          month: 'price_per_month'
        }
        const field = fieldMap[type]
        
        if (checked) {
          // If checked, set the current value or 0
          const value = type === 'day' ? formData.priceDay : 
                        type === 'hour' ? formData.priceHour : formData.priceMonth
          updateData[field] = parseInt(value) || 0
        } else {
          // If unchecked, set to null
          updateData[field] = null
        }

        const { error } = await supabase
          .from('vehicles')
          .update(updateData)
          .eq('id', formData.id)

        if (error) throw error
      } catch (error) {
        console.error('Error saving pricing type:', error)
      }
    }
  }

  // Handle document upload
  const handleDocumentUpload = async (field: 'newLicenseDocument' | 'newInsuranceDocument' | 'newRegistrationDocument', file: File | null) => {
    handleFileUpload(field, file)
    
    if (!file || !formData.id) return

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      let bucketName = ''
      let filePath = ''
      let dbField = ''

      if (field === 'newLicenseDocument') {
        bucketName = 'license'
        filePath = `${formData.id}/license_${timestamp}.${fileExt}`
        dbField = 'license_document'
      } else if (field === 'newInsuranceDocument') {
        bucketName = 'license_insurance'
        filePath = `${formData.id}/insurance_${timestamp}.${fileExt}`
        dbField = 'insurance_document'
      } else {
        bucketName = 'vehicles'
        filePath = `documents/${formData.id}/registration_${timestamp}.${fileExt}`
        dbField = 'registration_document'
      }

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ [dbField]: publicUrl })
        .eq('id', formData.id)

      if (updateError) throw updateError

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error uploading document:', error)
      setErrors(prev => ({
        ...prev,
        [field]: 'Failed to upload document. Please try again.'
      }))
    } finally {
      setUploading(false)
    }
  }

  // Handle image save
  const saveImages = async () => {
    if (!formData.id) return

    setSaving(true)
    setUploading(true)

    try {
      let updatedImages = [...formData.existingImages]
      
      // Upload new images
      for (const file of formData.newImages) {
        try {
          const fileExt = file.name.split('.').pop()
          const timestamp = Date.now()
          const index = updatedImages.length
          const fileName = `${formData.id}/vehicle_${index}_${timestamp}.${fileExt}`
          const filePath = `vehicles/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('vehicles')
            .upload(filePath, file, { cacheControl: '3600', upsert: false })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('vehicles')
            .getPublicUrl(filePath)

          updatedImages.push(publicUrl)
        } catch (error) {
          console.error('Error uploading image:', error)
        }
      }

      // Update the vehicle with new images array
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ images: updatedImages })
        .eq('id', formData.id)

      if (updateError) throw updateError

      // Clear new images after successful upload
      setFormData(prev => ({
        ...prev,
        existingImages: updatedImages,
        newImages: [],
        newImageUrls: []
      }))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error saving images:', error)
      setErrors(prev => ({
        ...prev,
        images: 'Failed to save images. Please try again.'
      }))
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDelete = () => {
    onDelete?.(formData.id)
    onOpenChange?.(false)
    setShowDeleteConfirm(false)
  }

  const getDocumentStatus = (expiryDate: string, hasDocument: boolean) => {
    if (!expiryDate || !hasDocument) return { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
    if (isDocumentExpired(expiryDate)) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' }
    }
    return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800' }
  }

  // Get vehicle type icon
  const getVehicleIcon = (type: string) => {
    const found = vehicleTypes.find(v => v.value === type)
    return found ? found.icon : Car
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:!max-w-[90vw] md:!max-w-[85vw] lg:!max-w-[80vw] xl:!max-w-[75vw] 2xl:!max-w-[70vw] p-0"
      >
        <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Edit className="w-6 h-6 text-blue-600" />
                Edit Vehicle
              </SheetTitle>
              <SheetDescription>
                Click on any editable field to update. Changes are saved automatically.
              </SheetDescription>
            </div>
            {saveSuccess && (
              <Badge className="bg-green-500 text-white animate-in fade-in">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
            {saving && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-6 space-y-6">
            {/* Vehicle Type Display */}
            {formData.vehicleType && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    {React.createElement(getVehicleIcon(formData.vehicleType), { 
                      className: "w-6 h-6 text-blue-600" 
                    })}
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Type</p>
                      <p className="font-semibold capitalize">
                        {vehicleTypes.find(v => v.value === formData.vehicleType)?.label || formData.vehicleType}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step Indicator */}
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
              <Badge variant={step === 1 ? "default" : "outline"} className="px-4 py-1.5">
                Step 1: Vehicle Details
              </Badge>
              <Badge variant={step === 2 ? "default" : "outline"} className="px-4 py-1.5">
                Step 2: Pricing
              </Badge>
              <Badge variant={step === 3 ? "default" : "outline"} className="px-4 py-1.5">
                Step 3: Documents
              </Badge>
            </div>

            {/* Step 1: Vehicle Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand</Label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      onBlur={(e) => autoSave('brand', e.target.value)}
                      className={errors.brand ? 'border-red-500' : ''}
                    />
                    {errors.brand && <p className="text-sm text-red-500">{errors.brand}</p>}
                  </div>
                  <div>
                    <Label>Model</Label>
                    <Input
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      onBlur={(e) => autoSave('model', e.target.value)}
                      className={errors.model ? 'border-red-500' : ''}
                    />
                    {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      onBlur={(e) => autoSave('year', e.target.value)}
                      className={errors.year ? 'border-red-500' : ''}
                    />
                    {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
                  </div>
                  <div>
                    <Label>Plate Number</Label>
                    <Input
                      value={formData.plateNumber}
                      onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                      onBlur={(e) => autoSave('plateNumber', e.target.value)}
                      className={errors.plateNumber ? 'border-red-500' : ''}
                    />
                    {errors.plateNumber && <p className="text-sm text-red-500">{errors.plateNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Color</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      onBlur={(e) => autoSave('color', e.target.value)}
                      className={errors.color ? 'border-red-500' : ''}
                    />
                    {errors.color && <p className="text-sm text-red-500">{errors.color}</p>}
                  </div>
                  <div>
                    <Label>Seats *</Label>
                    <Input
                      type="number"
                      value={formData.seats}
                      onChange={(e) => handleInputChange('seats', e.target.value)}
                      onBlur={(e) => autoSave('seats', e.target.value)}
                      className={errors.seats ? 'border-red-500' : ''}
                    />
                    {errors.seats && <p className="text-sm text-red-500">{errors.seats}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Transmission</Label>
                    <RadioGroup
                      value={formData.transmission}
                      onValueChange={(value) => {
                        handleInputChange('transmission', value)
                        autoSave('transmission', value)
                      }}
                      className="flex gap-4 mt-2"
                    >
                      {transmissionTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={`edit-trans-${type}`} />
                          <Label htmlFor={`edit-trans-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label>Fuel Type</Label>
                    <RadioGroup
                      value={formData.fuelType}
                      onValueChange={(value) => {
                        handleInputChange('fuelType', value)
                        autoSave('fuelType', value)
                      }}
                      className="flex flex-wrap gap-4 mt-2"
                    >
                      {fuelTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={`edit-fuel-${type}`} />
                          <Label htmlFor={`edit-fuel-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Update additional details about the vehicle..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    onBlur={(e) => autoSave('description', e.target.value)}
                  />
                </div>

                {/* Images Section */}
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Vehicle Images ({formData.existingImages.length + formData.newImages.length}/{MAX_IMAGES})
                  </Label>
                  
                  {/* Existing Images */}
                  {formData.existingImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {formData.existingImages.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                          <Image
                            src={url}
                            alt={`Vehicle ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Badge className="absolute bottom-1 left-1 text-xs bg-black/50">
                            {index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Images Preview */}
                  {formData.newImageUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {formData.newImageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                          <Image
                            src={url}
                            alt={`New ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Badge className="absolute bottom-1 left-1 text-xs bg-green-500">
                            New
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  {(formData.existingImages.length + formData.newImages.length) < MAX_IMAGES && (
                    <div className="mt-3">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="edit-image-upload"
                        onChange={(e) => handleNewImageUpload(e.target.files)}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-20 border-2 border-dashed"
                        onClick={() => document.getElementById('edit-image-upload')?.click()}
                        disabled={uploading}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          ) : (
                            <Plus className="w-6 h-6 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            Add more images ({MAX_IMAGES - (formData.existingImages.length + formData.newImages.length)} remaining)
                          </span>
                          <span className="text-xs text-muted-foreground">
                            JPEG, PNG, WebP up to 10MB
                          </span>
                        </div>
                      </Button>
                    </div>
                  )}

                  {/* Save Images Button */}
                  {(formData.newImages.length > 0 || formData.imagesToDelete.length > 0) && (
                    <Button
                      className="w-full mt-3 bg-green-600 hover:bg-green-700"
                      onClick={saveImages}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving Images...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Save Image Changes ({formData.newImages.length} new, {formData.imagesToDelete.length} removed)
                        </>
                      )}
                    </Button>
                  )}

                  {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
                </div>

                <Button className="w-full" onClick={() => setStep(2)}>
                  Next: Pricing →
                </Button>
              </div>
            )}

            {/* Step 2: Pricing */}
            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <Label className="text-base font-semibold mb-4 block">Pricing Options</Label>
                    <div className="space-y-4">
                      {/* Day */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-price-day"
                          checked={formData.pricingTypes.day}
                          onCheckedChange={(checked) => handleCheckboxChange('day', checked as boolean)}
                        />
                        <Label htmlFor="edit-price-day" className="font-medium">Price per Day</Label>
                      </div>
                      {formData.pricingTypes.day && (
                        <div className="ml-6">
                          <Input
                            type="number"
                            placeholder="Enter day price (Rs.)"
                            value={formData.priceDay}
                            onChange={(e) => handleInputChange('priceDay', e.target.value)}
                            onBlur={(e) => autoSave('priceDay', e.target.value)}
                            className={errors.priceDay ? 'border-red-500' : ''}
                          />
                          {errors.priceDay && <p className="text-sm text-red-500">{errors.priceDay}</p>}
                        </div>
                      )}

                      {/* Hour */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-price-hour"
                          checked={formData.pricingTypes.hour}
                          onCheckedChange={(checked) => handleCheckboxChange('hour', checked as boolean)}
                        />
                        <Label htmlFor="edit-price-hour" className="font-medium">Price per Hour</Label>
                      </div>
                      {formData.pricingTypes.hour && (
                        <div className="ml-6">
                          <Input
                            type="number"
                            placeholder="Enter hour price (Rs.)"
                            value={formData.priceHour}
                            onChange={(e) => handleInputChange('priceHour', e.target.value)}
                            onBlur={(e) => autoSave('priceHour', e.target.value)}
                            className={errors.priceHour ? 'border-red-500' : ''}
                          />
                          {errors.priceHour && <p className="text-sm text-red-500">{errors.priceHour}</p>}
                        </div>
                      )}

                      {/* Month */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-price-month"
                          checked={formData.pricingTypes.month}
                          onCheckedChange={(checked) => handleCheckboxChange('month', checked as boolean)}
                        />
                        <Label htmlFor="edit-price-month" className="font-medium">Price per Month</Label>
                      </div>
                      {formData.pricingTypes.month && (
                        <div className="ml-6">
                          <Input
                            type="number"
                            placeholder="Enter month price (Rs.)"
                            value={formData.priceMonth}
                            onChange={(e) => handleInputChange('priceMonth', e.target.value)}
                            onBlur={(e) => autoSave('priceMonth', e.target.value)}
                            className={errors.priceMonth ? 'border-red-500' : ''}
                          />
                          {errors.priceMonth && <p className="text-sm text-red-500">{errors.priceMonth}</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Next: Documents →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <div className="space-y-6">
                {/* License Document - All Disabled */}
                <Card className={errors.licenseNumber || errors.licenseExpiry || errors.licenseDocument ? 'border-red-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        License Document *
                      </Label>
                      {(formData.newLicenseDocument || formData.existingLicenseDoc) && (
                        <Badge className={getDocumentStatus(formData.licenseExpiry, !!(formData.newLicenseDocument || formData.existingLicenseDoc)).color}>
                          {getDocumentStatus(formData.licenseExpiry, !!(formData.newLicenseDocument || formData.existingLicenseDoc)).label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>License Number</Label>
                        <Input
                          value={formData.licenseNumber}
                          disabled
                          className="bg-muted/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Read-only - Cannot be changed
                        </p>
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={formData.licenseExpiry}
                            disabled
                            className="bg-muted/50 pl-10 cursor-not-allowed"
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Read-only - Cannot be changed</p>
                        {formData.licenseExpiry && !isDocumentExpired(formData.licenseExpiry) && (formData.newLicenseDocument || formData.existingLicenseDoc) && (
                          <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            License is valid
                          </p>
                        )}
                        {formData.licenseExpiry && isDocumentExpired(formData.licenseExpiry) && (
                          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            License has expired!
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Upload License Document</Label>
                        <div className="mt-1 flex items-center gap-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('edit-license-upload')?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {formData.newLicenseDocument ? 'Change File' : (formData.existingLicenseDoc ? 'Replace File' : 'Upload Document')}
                          </Button>
                          <input
                            id="edit-license-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              handleDocumentUpload('newLicenseDocument', file)
                            }}
                          />
                          {formData.existingLicenseDoc && !formData.newLicenseDocument && (
                            <Badge variant="outline" className="text-xs">
                              Current document uploaded
                            </Badge>
                          )}
                        </div>
                        {formData.newLicenseDocument && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ New: {formData.newLicenseDocument.name}
                          </p>
                        )}
                        {errors.licenseDocument && <p className="text-sm text-red-500">{errors.licenseDocument}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Document - All Disabled */}
                <Card className={errors.insuranceNumber || errors.insuranceExpiry || errors.insuranceDocument ? 'border-red-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Insurance Document *
                      </Label>
                      {(formData.newInsuranceDocument || formData.existingInsuranceDoc) && (
                        <Badge className={getDocumentStatus(formData.insuranceExpiry, !!(formData.newInsuranceDocument || formData.existingInsuranceDoc)).color}>
                          {getDocumentStatus(formData.insuranceExpiry, !!(formData.newInsuranceDocument || formData.existingInsuranceDoc)).label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Insurance Number</Label>
                        <Input
                          value={formData.insuranceNumber}
                          disabled
                          className="bg-muted/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Read-only - Cannot be changed
                        </p>
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={formData.insuranceExpiry}
                            disabled
                            className="bg-muted/50 pl-10 cursor-not-allowed"
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Read-only - Cannot be changed</p>
                        {formData.insuranceExpiry && !isDocumentExpired(formData.insuranceExpiry) && (formData.newInsuranceDocument || formData.existingInsuranceDoc) && (
                          <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Insurance is valid
                          </p>
                        )}
                        {formData.insuranceExpiry && isDocumentExpired(formData.insuranceExpiry) && (
                          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Insurance has expired!
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Upload Insurance Document</Label>
                        <div className="mt-1 flex items-center gap-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('edit-insurance-upload')?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {formData.newInsuranceDocument ? 'Change File' : (formData.existingInsuranceDoc ? 'Replace File' : 'Upload Document')}
                          </Button>
                          <input
                            id="edit-insurance-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              handleDocumentUpload('newInsuranceDocument', file)
                            }}
                          />
                          {formData.existingInsuranceDoc && !formData.newInsuranceDocument && (
                            <Badge variant="outline" className="text-xs">
                              Current document uploaded
                            </Badge>
                          )}
                        </div>
                        {formData.newInsuranceDocument && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ New: {formData.newInsuranceDocument.name}
                          </p>
                        )}
                        {errors.insuranceDocument && <p className="text-sm text-red-500">{errors.insuranceDocument}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Document - All Disabled */}
                <Card className={errors.registrationNumber || errors.registrationExpiry || errors.registrationDocument ? 'border-red-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Registration Document *
                      </Label>
                      {(formData.newRegistrationDocument || formData.existingRegistrationDoc) && (
                        <Badge className={getDocumentStatus(formData.registrationExpiry, !!(formData.newRegistrationDocument || formData.existingRegistrationDoc)).color}>
                          {getDocumentStatus(formData.registrationExpiry, !!(formData.newRegistrationDocument || formData.existingRegistrationDoc)).label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Registration Number</Label>
                        <Input
                          value={formData.registrationNumber}
                          disabled
                          className="bg-muted/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Read-only - Cannot be changed
                        </p>
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={formData.registrationExpiry}
                            disabled
                            className="bg-muted/50 pl-10 cursor-not-allowed"
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Read-only - Cannot be changed</p>
                        {formData.registrationExpiry && !isDocumentExpired(formData.registrationExpiry) && (formData.newRegistrationDocument || formData.existingRegistrationDoc) && (
                          <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Registration is valid
                          </p>
                        )}
                        {formData.registrationExpiry && isDocumentExpired(formData.registrationExpiry) && (
                          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Registration has expired!
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Upload Registration Document</Label>
                        <div className="mt-1 flex items-center gap-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('edit-registration-upload')?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {formData.newRegistrationDocument ? 'Change File' : (formData.existingRegistrationDoc ? 'Replace File' : 'Upload Document')}
                          </Button>
                          <input
                            id="edit-registration-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              handleDocumentUpload('newRegistrationDocument', file)
                            }}
                          />
                          {formData.existingRegistrationDoc && !formData.newRegistrationDocument && (
                            <Badge variant="outline" className="text-xs">
                              Current document uploaded
                            </Badge>
                          )}
                        </div>
                        {formData.newRegistrationDocument && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ New: {formData.newRegistrationDocument.name}
                          </p>
                        )}
                        {errors.registrationDocument && <p className="text-sm text-red-500">{errors.registrationDocument}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Status Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Document Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>License</span>
                        <Badge className={getDocumentStatus(formData.licenseExpiry, !!(formData.newLicenseDocument || formData.existingLicenseDoc)).color}>
                          {getDocumentStatus(formData.licenseExpiry, !!(formData.newLicenseDocument || formData.existingLicenseDoc)).label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Insurance</span>
                        <Badge className={getDocumentStatus(formData.insuranceExpiry, !!(formData.newInsuranceDocument || formData.existingInsuranceDoc)).color}>
                          {getDocumentStatus(formData.insuranceExpiry, !!(formData.newInsuranceDocument || formData.existingInsuranceDoc)).label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Registration</span>
                        <Badge className={getDocumentStatus(formData.registrationExpiry, !!(formData.newRegistrationDocument || formData.existingRegistrationDoc)).color}>
                          {getDocumentStatus(formData.registrationExpiry, !!(formData.newRegistrationDocument || formData.existingRegistrationDoc)).label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                </div>

                {errors.submit && (
                  <p className="text-sm text-red-500 text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.submit}
                  </p>
                )}

                <Separator />

                {/* Delete Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-destructive">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete this vehicle</p>
                    </div>
                    {!showDeleteConfirm ? (
                      <Button 
                        variant="destructive" 
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete Vehicle
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleDelete}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Confirm Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}