'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, Home, Users, Calendar, Car } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SidebarUser {
  name: string
  email: string
  avatar: string
}

interface AppSidebarProps {
  user?: SidebarUser
}

export default function AppSidebar({ user }: AppSidebarProps) {
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

      {/* Profile Card & Footer */}
      <SidebarFooter className="border-t border-sidebar-border pt-4">
        {user ? (
          <div className="space-y-3">
            {/* Profile Card */}
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-2">
              <Image
                src={user.avatar}
                alt={user.name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-sidebar-accent-foreground/70">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <Separator className="my-1" />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <span className="text-xs">Account Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <span className="text-xs">Help & Support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <Separator className="my-1" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        ) : (
          <div className="text-center text-xs text-sidebar-foreground/60">
            Sign in to see your profile
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
