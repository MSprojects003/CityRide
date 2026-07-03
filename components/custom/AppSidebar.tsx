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
import logo from "@/public/assets/logo/cityride.png"

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
      <SidebarHeader className="border-b border-sidebar-border px-0 py-0"> 
  <div className="flex items-center justify-center">
    <div className="h-20 w-30 flex items-center justify-center">
      <Image
        src={logo}
        alt="CityRide Logo"
        width={130}
        height={130}
        className="object-contain"
        priority
      />
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