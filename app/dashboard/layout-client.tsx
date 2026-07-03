'use client'

import { useAuth } from '@/lib/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from '@/components/custom/AppSidebar'
import { ReactNode } from 'react'

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const mockUser = {
    name: `${user.user_metadata?.name || user.email}`,
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
  }

  return (
    <SidebarProvider>
      <AppSidebar user={mockUser} />
      {children}
    </SidebarProvider>
  )
}
