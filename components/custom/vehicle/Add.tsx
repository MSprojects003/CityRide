'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Car, 
  Bike, 
  Ship, 
  Bus, 
  Truck, 
  BikeIcon, 
  FileText,
  AlertCircle,
  X,
  Upload,
  Clock,
  Image as ImageIcon,
  Loader2,
  Scan,
  Shield,
  FileCheck,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Separator } from '@/components/ui/separator'
import Tesseract from 'tesseract.js'
import { vendorApi } from '@/lib/api/vendor'

interface VehicleFormData {
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
  
  priceDay: string
  priceHour: string
  priceMonth: string
  pricingTypes: {
    day: boolean
    hour: boolean
    month: boolean
  }
  
  licenseNumber: string
  licenseExpiry: string
  insuranceNumber: string
  insuranceExpiry: string
  registrationNumber: string
  
  licenseDocument: File | null
  insuranceDocument: File | null
  registrationDocument: File | null
  
  licenseImage: File | null
  licenseImageUrl: string
  insuranceImage: File | null
  insuranceImageUrl: string
  registrationImage: File | null
  registrationImageUrl: string
  isLicenseExtracting: boolean
  isInsuranceExtracting: boolean
  isRegistrationExtracting: boolean
  licenseExtractedData: {
    number: string
    expiry: string
    startDate?: string
    endDate?: string
    rawText?: string
  }
  insuranceExtractedData: {
    number: string
    expiry: string
    startDate?: string
    endDate?: string
    rawText?: string
  }
  registrationExtractedData: {
    number: string
    rawText?: string
  }
  
  images: File[]
  imageUrls: string[]
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
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeYear = (year: number): number => {
  if (year < 100) {
    return year <= 29 ? 2000 + year : 1900 + year
  }
  return year
}

export function AddVehicle() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendorLoading, setVendorLoading] = useState(true)

  const [formData, setFormData] = useState<VehicleFormData>({
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
    licenseDocument: null,
    insuranceDocument: null,
    registrationDocument: null,
    licenseImage: null,
    licenseImageUrl: '',
    insuranceImage: null,
    insuranceImageUrl: '',
    registrationImage: null,
    registrationImageUrl: '',
    isLicenseExtracting: false,
    isInsuranceExtracting: false,
    isRegistrationExtracting: false,
    licenseExtractedData: { number: '', expiry: '' },
    insuranceExtractedData: { number: '', expiry: '' },
    registrationExtractedData: { number: '' },
    images: [],
    imageUrls: []
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)
  const [showLicenseImage, setShowLicenseImage] = useState(false)
  const [showInsuranceImage, setShowInsuranceImage] = useState(false)
  const [showRegistrationImage, setShowRegistrationImage] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const licenseImageInputRef = useRef<HTMLInputElement>(null)
  const insuranceImageInputRef = useRef<HTMLInputElement>(null)
  const registrationImageInputRef = useRef<HTMLInputElement>(null)

  // ========== GET CURRENT VENDOR ==========
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setVendorLoading(true)

        // 1. First try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
        }

        let user = session?.user

        // 2. Fallback to getUser()
        if (!user) {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          user = authUser ?? undefined // ✅ Fix: Convert null to undefined
        }

        if (!user) {
          console.log('No logged in user found')
          setVendorId(null)
          return
        }

        console.log('Logged in user ID:', user.id)

        // 3. Get vendor using the real user ID
        const vendor = await vendorApi.getVendorByUserId(user.id)

        if (vendor) {
          console.log('Vendor found:', vendor.id)
          setVendorId(vendor.id)
        } else {
          console.warn('No vendor profile found for this user')
          setVendorId(null)
        }
      } catch (error) {
        console.error('Error fetching vendor:', error)
        setVendorId(null)
      } finally {
        setVendorLoading(false)
      }
    }

    fetchVendor()

    // 4. Also listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchVendor()
      } else {
        setVendorId(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isDocumentExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    return expiry < today
  }

  const areDocumentsValid = () => {
    const licenseValid = formData.licenseImage && 
                         formData.licenseExtractedData.expiry && 
                         !isDocumentExpired(formData.licenseExtractedData.expiry)
    
    const insuranceValid = formData.insuranceImage && 
                           formData.insuranceExtractedData.expiry && 
                           !isDocumentExpired(formData.insuranceExtractedData.expiry)
    
    const registrationValid = formData.registrationImage && 
                              formData.registrationExtractedData.number
    
    return licenseValid && insuranceValid && registrationValid
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

  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const scale = 2
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          
          if (ctx) {
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const data = imageData.data
            
            const contrast = 1.5
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
            
            for (let i = 0; i < data.length; i += 4) {
              data[i] = factor * (data[i] - 128) + 128
              data[i+1] = factor * (data[i+1] - 128) + 128
              data[i+2] = factor * (data[i+2] - 128) + 128
            }
            
            ctx.putImageData(imageData, 0, 0)
            resolve(canvas.toDataURL('image/png'))
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const extractTextFromImage = async (imageFile: File): Promise<string> => {
    try {
      const processedImageUrl = await preprocessImage(imageFile)
      
      const result = await Tesseract.recognize(processedImageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        }
      })
      
      return result.data.text
    } catch (error) {
      console.error('OCR Error:', error)
      throw new Error('Failed to extract text from image')
    }
  }

  // ====================== LICENSE EXTRACTION ======================
  const extractLicenseInfo = (text: string): { number: string; expiry: string; startDate?: string; endDate?: string } => {
    let number = ''
    let expiry = ''
    let startDate = ''
    let endDate = ''

    const cleanText = text.toUpperCase().replace(/\s+/g, ' ').trim()

    const licensePatterns = [
      /LICENCE\s*NO\.?\s*[:\-]?\s*([A-Z]{1,3}\s?\d{5,})/i,
      /LICENSE\s*NO\.?\s*[:\-]?\s*([A-Z]{1,3}\s?\d{5,})/i,
      /LICENCE\s*NUMBER\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
      /LICENSE\s*NUMBER\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
      /REVENUE\s*LICENCE\s*(?:NO|NUMBER)?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
      /VEHICLE\s*NO\.?\s*[:\-]?\s*([0-9]{2,3}[\-\s]?[0-9]{4})/i,
      /\b([A-Z]{2}\s?\d{5,7})\b/,
      /\b(\d{2,3}[\-\s]\d{4})\b/,
    ]

    for (const pattern of licensePatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1] && match[1].length > 4) {
        number = match[1].replace(/\s+/g, '').trim()
        break
      }
    }

    const datePatterns = [
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
      /(\d{4})\s*-\s*(\d{1,2})\s*-\s*(\d{1,2})/g,
      /VALID\s+FROM\s+(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/i,
      /VALID\s+(?:FROM|TO|UNTIL|THRU)\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
    ]

    const dates: string[] = []

    for (const pattern of datePatterns) {
      let match
      while ((match = pattern.exec(cleanText)) !== null) {
        let year = 0, month = 0, day = 0

        if (match[1].length === 4) {
          year = parseInt(match[1])
          month = parseInt(match[2])
          day = parseInt(match[3])
        } else {
          const a = parseInt(match[1])
          const b = parseInt(match[2])
          year = normalizeYear(parseInt(match[3]))
          if (a > 12) {
            day = a
            month = b
          } else {
            month = a
            day = b
          }
        }

        if (year >= 1990 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          if (!dates.includes(dateStr)) dates.push(dateStr)
        }
      }
    }

    if (dates.length >= 2) {
      const sorted = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      startDate = sorted[0]
      expiry = sorted[sorted.length - 1]
      endDate = expiry
    } else if (dates.length === 1) {
      expiry = dates[0]
    }

    return { number, expiry, startDate, endDate }
  }

  // ====================== INSURANCE EXTRACTION ======================
  const extractInsuranceInfo = (text: string): { number: string; expiry: string; startDate?: string; endDate?: string } => {
    let number = ''
    let expiry = ''
    let startDate = ''
    let endDate = ''

    const cleanText = text.toUpperCase().replace(/\s+/g, ' ').trim()

    const strongPolicyPatterns = [
      /\b([A-Z]\d{1,2}[\-\s]?\d{4}[\-\s]?\d{4})\b/,
      /\b([A-Z]{1,3}\d{2,}[\-\s]?\d{3,}[\-\s]?\d{2,})\b/,
      /\b(\d{3}[\-\s]?\d{3}[\-\s]?\d{3,})\b/,
      /\b([A-Z0-9]{2,}[\-\s][A-Z0-9]{3,}[\-\s][A-Z0-9]{2,})\b/,
    ]

    for (const pattern of strongPolicyPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        const candidate = match[1].replace(/\s+/g, '').trim()
        if (
          candidate.length >= 8 &&
          !candidate.includes('DATE') &&
          !candidate.includes('NUMBER') &&
          !candidate.includes('EFFECTIVE') &&
          !candidate.includes('EXPIRATION')
        ) {
          number = candidate
          break
        }
      }
    }

    if (!number) {
      const nearPolicy = cleanText.match(
        /POLICY\s*(?:NUMBER|NO|#)?\s*[:\-]?\s*(?:EFFECTIVE|DATE|EXPIRATION)?\s*([A-Z0-9\-]{6,})/i
      )
      if (nearPolicy && nearPolicy[1]) {
        const candidate = nearPolicy[1].replace(/\s+/g, '').trim()
        if (
          candidate.length >= 6 &&
          !['NUMBER', 'EFFECTIVE', 'DATE', 'EXPIRATION'].includes(candidate)
        ) {
          number = candidate
        }
      }
    }

    if (!number) {
      const anyLong = cleanText.match(/\b([A-Z0-9\-]{8,15})\b/)
      if (anyLong && anyLong[1] && !anyLong[1].includes('DATE')) {
        number = anyLong[1]
      }
    }

    const expiryPatterns = [
      /EXPIRATION\s*DATE\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /EXPIRES?\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /VALID\s+(?:UPTO|UNTIL|THRU|TO)\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /EXPIRY\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /EXPIRATION\s*DATE[^0-9]{0,20}(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
    ]

    for (const pattern of expiryPatterns) {
      const match = cleanText.match(pattern)
      if (match) {
        let month = parseInt(match[1])
        let day = parseInt(match[2])
        let year = normalizeYear(parseInt(match[3]))

        if (month > 12 && day <= 12) {
          const tmp = month
          month = day
          day = tmp
        }

        if (year >= 1990 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          expiry = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          endDate = expiry
          break
        }
      }
    }

    const effectivePatterns = [
      /EFFECTIVE\s*DATE\s*[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      /EFFECTIVE\s*DATE[^0-9]{0,20}(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
    ]

    for (const pattern of effectivePatterns) {
      const match = cleanText.match(pattern)
      if (match) {
        let month = parseInt(match[1])
        let day = parseInt(match[2])
        let year = normalizeYear(parseInt(match[3]))

        if (month > 12 && day <= 12) {
          const tmp = month
          month = day
          day = tmp
        }

        if (year >= 1990 && year <= 2100) {
          startDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          break
        }
      }
    }

    if (!expiry) {
      const allDates = [...cleanText.matchAll(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g)]
      const parsedDates: string[] = []

      for (const m of allDates) {
        let month = parseInt(m[1])
        let day = parseInt(m[2])
        let year = normalizeYear(parseInt(m[3]))

        if (month > 12 && day <= 12) {
          const tmp = month
          month = day
          day = tmp
        }

        if (year >= 1990 && year <= 2100) {
          parsedDates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
        }
      }

      if (parsedDates.length >= 2) {
        const sorted = parsedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        startDate = sorted[0]
        expiry = sorted[sorted.length - 1]
        endDate = expiry
      } else if (parsedDates.length === 1) {
        expiry = parsedDates[0]
        endDate = expiry
      }
    }

    return { number, expiry, startDate, endDate }
  }

  // ====================== REGISTRATION EXTRACTION ======================
  const extractRegistrationInfo = (text: string): { number: string } => {
    let number = ''

    const cleanText = text.toUpperCase().replace(/\s+/g, ' ').trim()

    const registrationPatterns = [
      /REGISTRATION\s*NUMBER\s*[:\-]?\s*([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4})/i,
      /REGISTRATION\s*NO\.?\s*[:\-]?\s*([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4})/i,
      /REG\s*NO\.?\s*[:\-]?\s*([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4})/i,
      /REGISTRATION\s*NUMBER\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
      /REGISTRATION\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
      /\b([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4})\b/,
      /\b([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4})\b/,
    ]

    for (const pattern of registrationPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        number = match[1].replace(/\s+/g, '').trim()
        if (number.length >= 6 && !number.includes('CERTIFICATE') && !number.includes('DETAILS')) {
          break
        }
        number = ''
      }
    }

    if (!number) {
      const fallback = cleanText.match(/REGISTRATION[^A-Z0-9]{0,25}([A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4})/i)
      if (fallback && fallback[1]) {
        number = fallback[1].replace(/\s+/g, '').trim()
      }
    }

    return { number }
  }

  // ====================== PROCESS FUNCTIONS ======================
  const processLicenseImage = async (file: File) => {
    setFormData(prev => ({ ...prev, isLicenseExtracting: true }))

    try {
      setOcrProgress(0)
      const extractedText = await extractTextFromImage(file)
      const info = extractLicenseInfo(extractedText)

      setFormData(prev => ({
        ...prev,
        licenseExtractedData: {
          number: info.number || '',
          expiry: info.expiry || '',
          startDate: info.startDate,
          endDate: info.endDate,
          rawText: extractedText
        },
        licenseNumber: info.number || '',
        licenseExpiry: info.expiry || '',
        isLicenseExtracting: false
      }))

      if (!info.number || !info.expiry) {
        setErrors(prev => ({
          ...prev,
          licenseImage: 'Could not fully extract data from license image. Please ensure the image is clear.'
        }))
      } else {
        setErrors(prev => ({ ...prev, licenseImage: '' }))
      }
    } catch (error) {
      console.error('Error processing license:', error)
      setFormData(prev => ({ ...prev, isLicenseExtracting: false }))
      setErrors(prev => ({
        ...prev,
        licenseImage: 'Failed to process license image. Please try again with a clearer image.'
      }))
    }
  }

  const processInsuranceImage = async (file: File) => {
    setFormData(prev => ({ ...prev, isInsuranceExtracting: true }))

    try {
      setOcrProgress(0)
      const extractedText = await extractTextFromImage(file)
      const info = extractInsuranceInfo(extractedText)

      setFormData(prev => ({
        ...prev,
        insuranceExtractedData: {
          number: info.number || '',
          expiry: info.expiry || '',
          startDate: info.startDate,
          endDate: info.endDate,
          rawText: extractedText
        },
        insuranceNumber: info.number || '',
        insuranceExpiry: info.expiry || '',
        isInsuranceExtracting: false
      }))

      if (!info.number || !info.expiry) {
        setErrors(prev => ({
          ...prev,
          insuranceImage: 'Could not fully extract data from insurance image. Please ensure the image is clear.'
        }))
      } else {
        setErrors(prev => ({ ...prev, insuranceImage: '' }))
      }
    } catch (error) {
      console.error('Error processing insurance:', error)
      setFormData(prev => ({ ...prev, isInsuranceExtracting: false }))
      setErrors(prev => ({
        ...prev,
        insuranceImage: 'Failed to process insurance image. Please try again with a clearer image.'
      }))
    }
  }

  const processRegistrationImage = async (file: File) => {
    setFormData(prev => ({ ...prev, isRegistrationExtracting: true }))

    try {
      setOcrProgress(0)
      const extractedText = await extractTextFromImage(file)
      const info = extractRegistrationInfo(extractedText)

      setFormData(prev => ({
        ...prev,
        registrationExtractedData: {
          number: info.number || '',
          rawText: extractedText
        },
        registrationNumber: info.number || '',
        isRegistrationExtracting: false
      }))

      if (!info.number) {
        setErrors(prev => ({
          ...prev,
          registrationImage: 'Could not extract registration number from image. Please ensure the image is clear.'
        }))
      } else {
        setErrors(prev => ({ ...prev, registrationImage: '' }))
      }
    } catch (error) {
      console.error('Error processing registration:', error)
      setFormData(prev => ({ ...prev, isRegistrationExtracting: false }))
      setErrors(prev => ({
        ...prev,
        registrationImage: 'Failed to process registration image. Please try again with a clearer image.'
      }))
    }
  }

  const handleLicenseImageUpload = async (file: File | null) => {
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, licenseImage: `Image is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }))
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, licenseImage: 'Please upload a JPEG, PNG, or WebP image' }))
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      licenseImage: file,
      licenseImageUrl: imageUrl
    }))

    await processLicenseImage(file)
  }

  const handleInsuranceImageUpload = async (file: File | null) => {
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, insuranceImage: `Image is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }))
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, insuranceImage: 'Please upload a JPEG, PNG, or WebP image' }))
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      insuranceImage: file,
      insuranceImageUrl: imageUrl
    }))

    await processInsuranceImage(file)
  }

  const handleRegistrationImageUpload = async (file: File | null) => {
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, registrationImage: `Image is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }))
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, registrationImage: 'Please upload a JPEG, PNG, or WebP image' }))
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      registrationImage: file,
      registrationImageUrl: imageUrl,
      registrationDocument: file
    }))

    await processRegistrationImage(file)
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return

    const newImages: File[] = []
    const newImageUrls: string[] = []
    let hasError = false

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, images: `Image ${file.name} is too large.` }))
        hasError = true
        return
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setErrors(prev => ({ ...prev, images: `Image ${file.name} is not supported.` }))
        hasError = true
        return
      }

      if (formData.images.length + newImages.length >= MAX_IMAGES) {
        setErrors(prev => ({ ...prev, images: `Maximum ${MAX_IMAGES} images allowed` }))
        hasError = true
        return
      }

      newImages.push(file)
      newImageUrls.push(URL.createObjectURL(file))
    })

    if (!hasError) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        imageUrls: [...prev.imageUrls, ...newImageUrls]
      }))
      setErrors(prev => ({ ...prev, images: '' }))
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }))
  }

  const removeLicenseImage = () => {
    setFormData(prev => ({
      ...prev,
      licenseImage: null,
      licenseImageUrl: '',
      licenseExtractedData: { number: '', expiry: '' },
      licenseNumber: '',
      licenseExpiry: ''
    }))
  }

  const removeInsuranceImage = () => {
    setFormData(prev => ({
      ...prev,
      insuranceImage: null,
      insuranceImageUrl: '',
      insuranceExtractedData: { number: '', expiry: '' },
      insuranceNumber: '',
      insuranceExpiry: ''
    }))
  }

  const removeRegistrationImage = () => {
    setFormData(prev => ({
      ...prev,
      registrationImage: null,
      registrationImageUrl: '',
      registrationDocument: null,
      registrationExtractedData: { number: '' },
      registrationNumber: ''
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vehicleType) newErrors.vehicleType = 'Please select a vehicle type'
    if (!formData.brand) newErrors.brand = 'Brand is required'
    if (!formData.model) newErrors.model = 'Model is required'
    if (!formData.year) newErrors.year = 'Year is required'
    if (!formData.plateNumber) newErrors.plateNumber = 'Plate number is required'
    if (!formData.seats) newErrors.seats = 'Number of seats is required'

    if (formData.pricingTypes.day && !formData.priceDay) newErrors.priceDay = 'Day price is required'
    if (formData.pricingTypes.hour && !formData.priceHour) newErrors.priceHour = 'Hour price is required'
    if (formData.pricingTypes.month && !formData.priceMonth) newErrors.priceMonth = 'Month price is required'

    if (!formData.licenseImage) {
      newErrors.licenseImage = 'Please upload license image'
    } else if (formData.licenseExtractedData.expiry && isDocumentExpired(formData.licenseExtractedData.expiry)) {
      newErrors.licenseExpiry = 'License has expired'
    }

    if (!formData.insuranceImage) {
      newErrors.insuranceImage = 'Please upload insurance image'
    } else if (formData.insuranceExtractedData.expiry && isDocumentExpired(formData.insuranceExtractedData.expiry)) {
      newErrors.insuranceExpiry = 'Insurance has expired'
    }

    if (!formData.registrationImage) {
      newErrors.registrationImage = 'Please upload registration image'
    } else if (!formData.registrationExtractedData.number) {
      newErrors.registrationNumber = 'Registration number could not be extracted. Please upload a clearer image.'
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one vehicle image is required'
    }

    if (!vendorId) {
      newErrors.submit = 'Vendor profile not found. Please complete your vendor registration first.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadImageToSupabase = async (file: File, vehicleId: string, folder: string, index: number): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${vehicleId}/${folder}_${index}_${Date.now()}.${fileExt}`
    const filePath = `vehicles/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('vehicles').getPublicUrl(filePath)
    return publicUrl
  }

  const uploadDocumentToSupabase = async (file: File, vehicleId: string, docType: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${vehicleId}/${docType}_${Date.now()}.${fileExt}`
    
    let bucketName = 'vehicles'
    let filePath = `documents/${fileName}`
    
    if (docType === 'license_image') {
      bucketName = 'license'
      filePath = `${fileName}`
    } else if (docType === 'insurance_image') {
      bucketName = 'license_insurance'
      filePath = `${fileName}`
    } else if (docType === 'registration_image') {
      bucketName = 'vehicles'
      filePath = `documents/${fileName}`
    }

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    return publicUrl
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    if (!vendorId) {
      setErrors({ submit: 'Vendor profile not found. Please complete your vendor registration first.' })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const vehicleData = {
        vehicle_type: formData.vehicleType,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        plate_number: formData.plateNumber,
        color: formData.color || null,
        seats: parseInt(formData.seats),
        transmission: formData.transmission || null,
        fuel_type: formData.fuelType || null,
        description: formData.description || null,
        price_per_day: formData.pricingTypes.day ? parseInt(formData.priceDay) : null,
        price_per_hour: formData.pricingTypes.hour ? parseInt(formData.priceHour) : null,
        price_per_month: formData.pricingTypes.month ? parseInt(formData.priceMonth) : null,
        license_number: formData.licenseExtractedData.number || '',
        license_expiry: formData.licenseExtractedData.expiry || '',
        license_expiry_extracted: formData.licenseExtractedData.expiry || '',
        insurance_number: formData.insuranceExtractedData.number || '',
        insurance_expiry: formData.insuranceExtractedData.expiry || '',
        registration_number: formData.registrationExtractedData.number || formData.registrationNumber || '',
        status: 'active',
        availability: true,
        is_deleted: false,
        vendor_id: vendorId
      }

      const { data: insertedVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single()

      if (insertError) throw insertError

      const vehicleId = insertedVehicle.id

      setUploadProgress(10)
      const imageUrls: string[] = []
      for (let i = 0; i < formData.images.length; i++) {
        setUploadProgress(10 + (i / formData.images.length) * 30)
        const url = await uploadImageToSupabase(formData.images[i], vehicleId, 'vehicle', i)
        imageUrls.push(url)
      }

      setUploadProgress(50)
      let licenseImageUrl = null
      if (formData.licenseImage) {
        licenseImageUrl = await uploadDocumentToSupabase(formData.licenseImage, vehicleId, 'license_image')
      }

      setUploadProgress(60)
      let insuranceImageUrl = null
      if (formData.insuranceImage) {
        insuranceImageUrl = await uploadDocumentToSupabase(formData.insuranceImage, vehicleId, 'insurance_image')
      }

      setUploadProgress(70)
      let registrationDocUrl = null
      if (formData.registrationImage) {
        registrationDocUrl = await uploadDocumentToSupabase(formData.registrationImage, vehicleId, 'registration_image')
      }

      setUploadProgress(85)
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          images: imageUrls,
          license_image_url: licenseImageUrl,
          insurance_image_url: insuranceImageUrl,
          license_document: licenseImageUrl,
          insurance_document: insuranceImageUrl,
          registration_document: registrationDocUrl,
          license_expiry_extracted: formData.licenseExtractedData.expiry || null,
          insurance_expiry_extracted: formData.insuranceExtractedData.expiry || null
        })
        .eq('id', vehicleId)

      if (updateError) throw updateError

      setUploadProgress(100)

      setTimeout(() => {
        setIsOpen(false)
        resetForm()
        setIsSubmitting(false)
        setUploadProgress(0)
        alert('Vehicle added successfully!')
      }, 500)

    } catch (error: any) {
      console.error('Error adding vehicle:', error)
      setErrors({ submit: error?.message || 'Failed to add vehicle. Please try again.' })
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setFormData({
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
      licenseDocument: null,
      insuranceDocument: null,
      registrationDocument: null,
      licenseImage: null,
      licenseImageUrl: '',
      insuranceImage: null,
      insuranceImageUrl: '',
      registrationImage: null,
      registrationImageUrl: '',
      isLicenseExtracting: false,
      isInsuranceExtracting: false,
      isRegistrationExtracting: false,
      licenseExtractedData: { number: '', expiry: '' },
      insuranceExtractedData: { number: '', expiry: '' },
      registrationExtractedData: { number: '' },
      images: [],
      imageUrls: []
    })
    setStep(1)
    setErrors({})
    setShowLicenseImage(false)
    setShowInsuranceImage(false)
    setShowRegistrationImage(false)
    setOcrProgress(0)
  }

  const getDocumentStatus = (expiryDate: string, hasDocument: boolean, isRegistration = false) => {
    if (!hasDocument) return { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
    if (isRegistration) {
      return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800' }
    }
    if (!expiryDate) return { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
    if (isDocumentExpired(expiryDate)) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' }
    }
    return { status: 'valid', label: 'Valid', color: 'bg-green-100 text-green-800' }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:!max-w-[90vw] md:!max-w-[85vw] lg:!max-w-[80vw] xl:!max-w-[75vw] 2xl:!max-w-[70vw] p-0"
      >
        <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            Add New Vehicle
          </SheetTitle>
          <SheetDescription>
            Fill in the details to add a new vehicle to your fleet.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-6 space-y-6">

            {/* Vendor Warning */}
            {!vendorLoading && !vendorId && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No vendor profile found. Please complete your vendor registration first.
              </div>
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

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* ==================== STEP 1 ==================== */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Vehicle Type</Label>
                  <RadioGroup
                    value={formData.vehicleType}
                    onValueChange={(value) => handleInputChange('vehicleType', value)}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2"
                    disabled={isSubmitting}
                  >
                    {vehicleTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <div key={type.value}>
                          <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                          <Label
                            htmlFor={type.value}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                          >
                            <Icon className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                  {errors.vehicleType && <p className="text-sm text-red-500 mt-1">{errors.vehicleType}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand *</Label>
                    <Input placeholder="e.g., Toyota" value={formData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} className={errors.brand ? 'border-red-500' : ''} disabled={isSubmitting} />
                    {errors.brand && <p className="text-sm text-red-500">{errors.brand}</p>}
                  </div>
                  <div>
                    <Label>Model *</Label>
                    <Input placeholder="e.g., Camry" value={formData.model} onChange={(e) => handleInputChange('model', e.target.value)} className={errors.model ? 'border-red-500' : ''} disabled={isSubmitting} />
                    {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Year *</Label>
                    <Input type="number" placeholder="e.g., 2024" value={formData.year} onChange={(e) => handleInputChange('year', e.target.value)} className={errors.year ? 'border-red-500' : ''} disabled={isSubmitting} />
                    {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
                  </div>
                  <div>
                    <Label>Plate Number *</Label>
                    <Input placeholder="e.g., ABC-1234" value={formData.plateNumber} onChange={(e) => handleInputChange('plateNumber', e.target.value)} className={errors.plateNumber ? 'border-red-500' : ''} disabled={isSubmitting} />
                    {errors.plateNumber && <p className="text-sm text-red-500">{errors.plateNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Color</Label>
                    <Input placeholder="e.g., White" value={formData.color} onChange={(e) => handleInputChange('color', e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label>Seats *</Label>
                    <Input type="number" placeholder="e.g., 5" value={formData.seats} onChange={(e) => handleInputChange('seats', e.target.value)} className={errors.seats ? 'border-red-500' : ''} disabled={isSubmitting} />
                    {errors.seats && <p className="text-sm text-red-500">{errors.seats}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Transmission</Label>
                    <RadioGroup value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)} className="flex gap-4 mt-2" disabled={isSubmitting}>
                      {transmissionTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={`trans-${type}`} />
                          <Label htmlFor={`trans-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label>Fuel Type</Label>
                    <RadioGroup value={formData.fuelType} onValueChange={(value) => handleInputChange('fuelType', value)} className="flex flex-wrap gap-4 mt-2" disabled={isSubmitting}>
                      {fuelTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={`fuel-${type}`} />
                          <Label htmlFor={`fuel-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input placeholder="Additional details about the vehicle..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} disabled={isSubmitting} />
                </div>

                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Vehicle Images * (Max {MAX_IMAGES})
                  </Label>
                  <div className="mt-2">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} disabled={isSubmitting || formData.images.length >= MAX_IMAGES} />
                    <Button type="button" variant="outline" className="w-full h-24 border-2 border-dashed" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting || formData.images.length >= MAX_IMAGES}>
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formData.images.length > 0 ? `${formData.images.length} / ${MAX_IMAGES} images selected` : 'Click to upload vehicle images'}
                        </span>
                      </div>
                    </Button>
                  </div>

                  {formData.imageUrls.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
                      {formData.imageUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                          {url && <Image src={url} alt={`Vehicle ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />}
                          <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" disabled={isSubmitting}>
                            <X className="w-3 h-3" />
                          </button>
                          <Badge className="absolute bottom-1 left-1 text-xs">{index + 1}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
                </div>

                <Button className="w-full" onClick={() => setStep(2)} disabled={!formData.vehicleType || !formData.brand || !formData.model || !formData.year || !formData.plateNumber || !formData.seats || formData.images.length === 0 || isSubmitting}>
                  Next: Pricing →
                </Button>
              </div>
            )}

            {/* ==================== STEP 2 ==================== */}
            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <Label className="text-base font-semibold mb-4 block">Pricing Options</Label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="price-day" checked={formData.pricingTypes.day} onCheckedChange={(checked) => handlePricingTypeChange('day', checked as boolean)} disabled={isSubmitting} />
                        <Label htmlFor="price-day" className="font-medium">Price per Day</Label>
                      </div>
                      {formData.pricingTypes.day && (
                        <div className="ml-6">
                          <Input type="number" placeholder="Enter day price (Rs.)" value={formData.priceDay} onChange={(e) => handleInputChange('priceDay', e.target.value)} className={errors.priceDay ? 'border-red-500' : ''} disabled={isSubmitting} />
                          {errors.priceDay && <p className="text-sm text-red-500">{errors.priceDay}</p>}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox id="price-hour" checked={formData.pricingTypes.hour} onCheckedChange={(checked) => handlePricingTypeChange('hour', checked as boolean)} disabled={isSubmitting} />
                        <Label htmlFor="price-hour" className="font-medium">Price per Hour</Label>
                      </div>
                      {formData.pricingTypes.hour && (
                        <div className="ml-6">
                          <Input type="number" placeholder="Enter hour price (Rs.)" value={formData.priceHour} onChange={(e) => handleInputChange('priceHour', e.target.value)} className={errors.priceHour ? 'border-red-500' : ''} disabled={isSubmitting} />
                          {errors.priceHour && <p className="text-sm text-red-500">{errors.priceHour}</p>}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox id="price-month" checked={formData.pricingTypes.month} onCheckedChange={(checked) => handlePricingTypeChange('month', checked as boolean)} disabled={isSubmitting} />
                        <Label htmlFor="price-month" className="font-medium">Price per Month</Label>
                      </div>
                      {formData.pricingTypes.month && (
                        <div className="ml-6">
                          <Input type="number" placeholder="Enter month price (Rs.)" value={formData.priceMonth} onChange={(e) => handleInputChange('priceMonth', e.target.value)} className={errors.priceMonth ? 'border-red-500' : ''} disabled={isSubmitting} />
                          {errors.priceMonth && <p className="text-sm text-red-500">{errors.priceMonth}</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>← Back</Button>
                  <Button className="flex-1" onClick={() => setStep(3)} disabled={isSubmitting}>Next: Documents →</Button>
                </div>
              </div>
            )}

            {/* ==================== STEP 3 ==================== */}
            {step === 3 && (
              <div className="space-y-6">
                {/* License */}
                <Card className={errors.licenseImage || errors.licenseExpiry ? 'border-red-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" /> License Document Image *
                      </Label>
                      {formData.licenseImage && (
                        <Badge className={getDocumentStatus(formData.licenseExtractedData.expiry, !!formData.licenseImage).color}>
                          {getDocumentStatus(formData.licenseExtractedData.expiry, !!formData.licenseImage).label}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Upload License Image *</Label>
                        <div className="mt-1 flex items-center gap-4">
                          <Button variant="outline" className="w-full" onClick={() => licenseImageInputRef.current?.click()} disabled={isSubmitting || formData.isLicenseExtracting}>
                            <Upload className="w-4 h-4 mr-2" />
                            {formData.licenseImage ? 'Change Image' : 'Upload License Image'}
                          </Button>
                          <input ref={licenseImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLicenseImageUpload(e.target.files?.[0] || null)} disabled={isSubmitting} />
                          {formData.licenseImage && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => setShowLicenseImage(!showLicenseImage)}>
                                {showLicenseImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={removeLicenseImage} disabled={isSubmitting}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {formData.licenseImage && showLicenseImage && (
                          <div className="relative mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                            <Image src={formData.licenseImageUrl} alt="License" fill className="object-cover" />
                          </div>
                        )}
                        {formData.isLicenseExtracting && (
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Extracting license information... ({ocrProgress}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-blue-600 h-1 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {errors.licenseImage && <p className="text-sm text-red-500 mt-1">{errors.licenseImage}</p>}
                      </div>

                      {formData.licenseExtractedData.number && (
                        <div className="bg-muted/30 p-3 rounded-lg space-y-2 border border-blue-200">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Scan className="w-4 h-4" />
                            <span className="font-semibold">AI Extracted Data (Read-only)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">License Number</Label>
                              <Input value={formData.licenseExtractedData.number} disabled className="bg-white font-mono text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                              <Input type="date" value={formData.licenseExtractedData.expiry} disabled className={`bg-white ${isDocumentExpired(formData.licenseExtractedData.expiry) ? 'border-red-500' : ''}`} />
                              {formData.licenseExtractedData.expiry && isDocumentExpired(formData.licenseExtractedData.expiry) && (
                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> License has expired!</p>
                              )}
                              {formData.licenseExtractedData.startDate && formData.licenseExtractedData.endDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Valid from {formatDate(formData.licenseExtractedData.startDate)} to {formatDate(formData.licenseExtractedData.endDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance */}
                <Card className={errors.insuranceImage || errors.insuranceExpiry ? 'border-red-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileCheck className="w-4 h-4" /> Insurance Document Image *
                      </Label>
                      {formData.insuranceImage && (
                        <Badge className={getDocumentStatus(formData.insuranceExtractedData.expiry, !!formData.insuranceImage).color}>
                          {getDocumentStatus(formData.insuranceExtractedData.expiry, !!formData.insuranceImage).label}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Upload Insurance Image *</Label>
                        <div className="mt-1 flex items-center gap-4">
                          <Button variant="outline" className="w-full" onClick={() => insuranceImageInputRef.current?.click()} disabled={isSubmitting || formData.isInsuranceExtracting}>
                            <Upload className="w-4 h-4 mr-2" />
                            {formData.insuranceImage ? 'Change Image' : 'Upload Insurance Image'}
                          </Button>
                          <input ref={insuranceImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleInsuranceImageUpload(e.target.files?.[0] || null)} disabled={isSubmitting} />
                          {formData.insuranceImage && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => setShowInsuranceImage(!showInsuranceImage)}>
                                {showInsuranceImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={removeInsuranceImage} disabled={isSubmitting}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {formData.insuranceImage && showInsuranceImage && (
                          <div className="relative mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                            <Image src={formData.insuranceImageUrl} alt="Insurance" fill className="object-cover" />
                          </div>
                        )}
                        {formData.isInsuranceExtracting && (
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Extracting insurance information... ({ocrProgress}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-blue-600 h-1 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {errors.insuranceImage && <p className="text-sm text-red-500 mt-1">{errors.insuranceImage}</p>}
                      </div>

                      {formData.insuranceExtractedData.number && (
                        <div className="bg-muted/30 p-3 rounded-lg space-y-2 border border-blue-200">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Scan className="w-4 h-4" />
                            <span className="font-semibold">AI Extracted Data (Read-only)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Policy Number</Label>
                              <Input value={formData.insuranceExtractedData.number} disabled className="bg-white font-mono text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                              <Input type="date" value={formData.insuranceExtractedData.expiry} disabled className={`bg-white ${isDocumentExpired(formData.insuranceExtractedData.expiry) ? 'border-red-500' : ''}`} />
                              {formData.insuranceExtractedData.expiry && isDocumentExpired(formData.insuranceExtractedData.expiry) && (
                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Insurance has expired!</p>
                              )}
                              {formData.insuranceExtractedData.startDate && formData.insuranceExtractedData.endDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Valid from {formatDate(formData.insuranceExtractedData.startDate)} to {formatDate(formData.insuranceExtractedData.endDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Registration */}
                <Card className={errors.registrationImage || errors.registrationNumber ? 'border-red-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Registration Document Image *
                      </Label>
                      {formData.registrationImage && (
                        <Badge className={getDocumentStatus('', !!formData.registrationImage, true).color}>
                          {getDocumentStatus('', !!formData.registrationImage, true).label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Upload Registration Image *</Label>
                        <div className="mt-1 flex items-center gap-4">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => registrationImageInputRef.current?.click()} 
                            disabled={isSubmitting || formData.isRegistrationExtracting}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {formData.registrationImage ? 'Change Image' : 'Upload Registration Image'}
                          </Button>
                          <input 
                            ref={registrationImageInputRef} 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleRegistrationImageUpload(e.target.files?.[0] || null)} 
                            disabled={isSubmitting} 
                          />
                          {formData.registrationImage && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => setShowRegistrationImage(!showRegistrationImage)}>
                                {showRegistrationImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={removeRegistrationImage} disabled={isSubmitting}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {formData.registrationImage && showRegistrationImage && (
                          <div className="relative mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                            <Image src={formData.registrationImageUrl} alt="Registration" fill className="object-cover" />
                          </div>
                        )}
                        {formData.isRegistrationExtracting && (
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Extracting registration information... ({ocrProgress}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-blue-600 h-1 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {errors.registrationImage && <p className="text-sm text-red-500 mt-1">{errors.registrationImage}</p>}
                      </div>

                      {formData.registrationExtractedData.number && (
                        <div className="bg-muted/30 p-3 rounded-lg space-y-2 border border-blue-200">
                          <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Scan className="w-4 h-4" />
                            <span className="font-semibold">AI Extracted Data (Read-only)</span>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Registration Number</Label>
                            <Input 
                              value={formData.registrationExtractedData.number} 
                              disabled 
                              className="bg-white font-mono text-sm" 
                            />
                          </div>
                        </div>
                      )}

                      {errors.registrationNumber && (
                        <p className="text-sm text-red-500">{errors.registrationNumber}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Summary */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Document Status Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> License</span>
                        <Badge className={getDocumentStatus(formData.licenseExtractedData.expiry, !!formData.licenseImage).color}>
                          {getDocumentStatus(formData.licenseExtractedData.expiry, !!formData.licenseImage).label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-green-600" /> Insurance</span>
                        <Badge className={getDocumentStatus(formData.insuranceExtractedData.expiry, !!formData.insuranceImage).color}>
                          {getDocumentStatus(formData.insuranceExtractedData.expiry, !!formData.insuranceImage).label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-600" /> Registration</span>
                        <Badge className={getDocumentStatus('', !!formData.registrationImage, true).color}>
                          {getDocumentStatus('', !!formData.registrationImage, true).label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)} disabled={isSubmitting}>← Back</Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    onClick={handleSubmit}
                    disabled={!areDocumentsValid() || isSubmitting || !vendorId}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                        Adding Vehicle...
                      </>
                    ) : (
                      'Add Vehicle'
                    )}
                  </Button>
                </div>

                {!areDocumentsValid() && (
                  <p className="text-sm text-red-500 text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Please complete all documents with valid data
                  </p>
                )}
                {errors.submit && (
                  <p className="text-sm text-red-500 text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {errors.submit}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}