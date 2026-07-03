'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

const PATH_LABELS: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'home': 'Home',
  'customers': 'Customers',
  'reservations': 'Reservations',
  'vehicles': 'My Vehicles',
}

export default function PageHeader() {
  const pathname = usePathname()
  
  // Extract the first segment of the path
  const segments = pathname.split('/').filter(Boolean)
  const currentSegment = segments[0] || ''
  const pageTitle = PATH_LABELS[currentSegment] || currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1)
  
  // Build breadcrumb trail
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' }
  ]
  
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    if (!isLast) {
      breadcrumbs.push({ label, href })
    } else {
      breadcrumbs.push({ label })
    }
  })

  return (
    <div className="border-b border-border bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 flex items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span
                  className={`text-sm ${
                    index === breadcrumbs.length - 1
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {crumb.label}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
        </div>
      </div>
    </div>
  )
}
