'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Home, Users, Calendar, Car } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import NavUser from '@/components/custom/NavUser'

interface SidebarUser {
  name: string
  email: string
  avatar: string
}

interface AppSidebarProps {
  user?: SidebarUser
  onLogout?: () => void
}

export default function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const navItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: Home,
    },
    {
      label: 'Customers',
      href: '/customers',
      icon: Users,
    },
    {
      label: 'Reservations',
      href: '/reservations',
      icon: Calendar,
    },
    {
      label: 'My Vehicles',
      href: '/vehicles',
      icon: Car,
    },
  ]

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      {/* Logo Section */}
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Image
              src="/cityride-logo.png"
              alt="CityRide Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">CityRide</span>
            <span className="text-xs text-sidebar-foreground/60">Platform</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent>
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Profile Dropdown Footer */}
      <SidebarFooter className="border-t border-sidebar-border pt-4">
        {user ? (
          <NavUser user={user} onLogout={onLogout} />
        ) : (
          <div className="text-center text-xs text-sidebar-foreground/60">
            Sign in to see your profile
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}