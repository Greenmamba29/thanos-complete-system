
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Files, FolderOpen, Zap, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsData {
  totalFiles: number
  organizedFiles: number
  totalOrganizations: number
  avgProcessingTime: number
}

export default function StatsOverview() {
  const [stats, setStats] = useState<StatsData>({
    totalFiles: 0,
    organizedFiles: 0,
    totalOrganizations: 0,
    avgProcessingTime: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Files',
      value: stats.totalFiles,
      icon: Files,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Organized',
      value: stats.organizedFiles,
      icon: FolderOpen,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Organizations',
      value: stats.totalOrganizations,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Avg Time',
      value: `${stats.avgProcessingTime}s`,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      isTime: true
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-4 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <motion.div
                    className="text-3xl font-bold"
                    key={stat.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isLoading ? (
                      <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      <CountUpAnimation 
                        value={stat.isTime ? stats.avgProcessingTime : stat.value as number} 
                        suffix={stat.isTime ? 's' : ''}
                      />
                    )}
                  </motion.div>
                </div>

                <div className={`p-3 rounded-full ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>

              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
                initial={{ x: '-100%' }}
                whileHover={{ x: '200%' }}
                transition={{ duration: 0.6 }}
              />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// Count-up animation component
function CountUpAnimation({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 1000 // 1 second
    const steps = 60
    const stepValue = value / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setCount(Math.min(Math.floor(stepValue * currentStep), value))
      
      if (currentStep >= steps) {
        clearInterval(timer)
        setCount(value)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return <span>{count}{suffix}</span>
}
