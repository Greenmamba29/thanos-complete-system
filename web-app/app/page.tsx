
import { Suspense } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import FileUploadZone from '@/components/file-upload-zone'
import OrganizationPanel from '@/components/organization-panel'
import StatsOverview from '@/components/stats-overview'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <DashboardHeader />
        
        {/* Stats Overview */}
        <Suspense fallback={<StatsOverviewSkeleton />}>
          <StatsOverview />
        </Suspense>
        
        {/* Main Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* File Upload Zone - Takes 2 columns */}
          <div className="lg:col-span-2">
            <FileUploadZone />
          </div>
          
          {/* Organization Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <OrganizationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsOverviewSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}
