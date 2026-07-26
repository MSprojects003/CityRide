'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  vehicleName: string
  vehicleBrand?: string
  vehicleModel?: string
  vehiclePlate?: string
  vehicleId?: string
  isLoading?: boolean
  deleteType?: 'vehicle' | 'document' | 'user' | 'generic'
  onSuccess?: () => void
  onError?: (error: any) => void
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  vehicleName,
  vehicleBrand = '',
  vehicleModel = '',
  vehiclePlate = '',
  vehicleId = '',
  isLoading = false,
  deleteType = 'vehicle',
  onSuccess,
  onError
}: DeleteDialogProps) {
  
  // Get the display name
  const getDisplayName = () => {
    if (vehicleBrand && vehicleModel) {
      return `${vehicleBrand} ${vehicleModel}`
    }
    return vehicleName || 'this item'
  }

  // Get the delete type specific content
  const getDeleteContent = () => {
    switch (deleteType) {
      case 'vehicle':
        return {
          title: 'Delete Vehicle',
          description: 'This action cannot be undone. This will permanently remove the vehicle from your fleet.',
          confirmText: 'Delete Vehicle',
          icon: <AlertTriangle className="h-6 w-6" />
        }
      case 'document':
        return {
          title: 'Delete Document',
          description: 'This action cannot be undone. This will permanently remove the document from the vehicle record.',
          confirmText: 'Delete Document',
          icon: <AlertTriangle className="h-6 w-6" />
        }
      case 'user':
        return {
          title: 'Delete User',
          description: 'This action cannot be undone. This will permanently remove the user from the system.',
          confirmText: 'Delete User',
          icon: <AlertTriangle className="h-6 w-6" />
        }
      default:
        return {
          title: 'Delete Item',
          description: 'This action cannot be undone. This will permanently remove this item.',
          confirmText: 'Delete',
          icon: <AlertTriangle className="h-6 w-6" />
        }
    }
  }

  const content = getDeleteContent()

  // Handle delete with is_deleted update
  const handleDelete = async () => {
    if (!vehicleId && deleteType === 'vehicle') {
      console.error('Vehicle ID is required for deletion')
      onError?.('Vehicle ID is required')
      return
    }

    try {
      if (deleteType === 'vehicle') {
        // Update is_deleted to true for soft delete
        const { error } = await supabase
          .from('vehicles')
          .update({ is_deleted: true })
          .eq('id', vehicleId)

        if (error) throw error

        // Call the onConfirm callback
        onConfirm()
        
        // Call onSuccess if provided
        onSuccess?.()
      } else {
        // For other delete types, just call onConfirm
        onConfirm()
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      onError?.(error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-red-100 p-2.5">
              {content.icon}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                {content.title}
                <Badge variant="destructive" className="text-xs">
                  Dangerous
                </Badge>
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-muted-foreground">
                {content.description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Vehicle Details Section */}
        {(vehicleBrand || vehicleModel || vehiclePlate) && (
          <div className="my-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
            <p className="text-sm font-medium text-red-800">
              You are about to delete:
            </p>
            <div className="mt-2 space-y-1">
              <p className="font-semibold text-red-900">
                {getDisplayName()}
              </p>
              {vehiclePlate && (
                <div className="flex items-center gap-2 text-xs text-red-700">
                  <span className="font-medium">Plate Number:</span>
                  <span className="font-mono">{vehiclePlate}</span>
                </div>
              )}
              {vehicleId && (
                <div className="flex items-center gap-2 text-xs text-red-700">
                  <span className="font-medium">Vehicle ID:</span>
                  <span className="font-mono text-xs">{vehicleId.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning Messages */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-red-600">
            <Trash2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>This action is <strong>irreversible</strong> and cannot be undone.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-amber-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>All associated data will be permanently removed.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
            <div className="w-4 h-4 flex-shrink-0 mt-0.5">ℹ️</div>
            <span>This will soft delete the vehicle by setting <strong>is_deleted = true</strong></span>
          </div>
        </div>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {content.confirmText}
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>

        {/* Footer Note */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Please confirm this action. <span className="font-medium text-red-600">{getDisplayName()}</span> cannot be recovered.
        </p>
      </AlertDialogContent>
    </AlertDialog>
  )
}