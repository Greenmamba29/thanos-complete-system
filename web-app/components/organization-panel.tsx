
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Infinity, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Eye, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { OrganizationResult, ProcessingProgress } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import OrganizationView from './organization-view'

export default function OrganizationPanel() {
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationResult | null>(null)
  const { toast } = useToast()

  // Load previous organizations on mount
  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const handleThanosClick = async () => {
    setIsOrganizing(true)
    setProgress(0)
    setCurrentStep('Initializing...')

    try {
      const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Organization failed')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let partialRead = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split('\n')
        partialRead = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setProgress(100)
              setCurrentStep('Completed!')
              await loadOrganizations()
              
              toast({
                title: 'Organization Complete!',
                description: 'Your files have been organized successfully.',
              })
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.status === 'processing') {
                setProgress(parsed.progress || 0)
                setCurrentStep(parsed.message || 'Processing...')
              } else if (parsed.status === 'completed') {
                setCurrentOrganization(parsed.result)
                setProgress(100)
                setCurrentStep('Completed!')
                await loadOrganizations()
                
                toast({
                  title: 'Organization Complete!',
                  description: `Successfully organized ${parsed.result?.filesProcessed || 0} files.`,
                })
                return
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'Organization failed')
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Organization error:', error)
      toast({
        title: 'Organization Failed',
        description: 'There was an error organizing your files. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsOrganizing(false)
      setTimeout(() => {
        setProgress(0)
        setCurrentStep('')
      }, 2000)
    }
  }

  const handleUndo = async (organizationId: string) => {
    try {
      const response = await fetch('/api/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (response.ok) {
        await loadOrganizations()
        toast({
          title: 'Organization Undone',
          description: 'Files have been restored to their original state.',
        })
      } else {
        throw new Error('Undo failed')
      }
    } catch (error) {
      toast({
        title: 'Undo Failed',
        description: 'Could not undo the organization.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* THANOS Button Card */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <motion.div
              className="relative mx-auto w-fit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleThanosClick}
                disabled={isOrganizing}
                size="lg"
                className={`
                  relative h-16 px-8 text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 
                  hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl
                  ${isOrganizing ? 'animate-pulse' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  {isOrganizing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                    >
                      <Infinity className="h-6 w-6" />
                    </motion.div>
                  )}
                  <span>
                    {isOrganizing ? 'ORGANIZING...' : 'THANOS'}
                  </span>
                  <Sparkles className="h-6 w-6" />
                </div>

                {/* Animated background effects */}
                {!isOrganizing && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-lg opacity-0"
                    whileHover={{ opacity: 0.2 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Button>

              {/* Power indicator */}
              {!isOrganizing && (
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-20 blur-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
            </motion.div>

            <p className="text-sm text-muted-foreground">
              Click to organize all uploaded files with AI
            </p>

            {/* Progress Indicator */}
            <AnimatePresence>
              {isOrganizing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <Progress value={progress} className="h-2 progress-gradient" />
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{currentStep}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Recent Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {organizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No organizations yet</p>
                <p className="text-sm">Upload files and click THANOS to get started</p>
              </div>
            ) : (
              organizations.slice(0, 5).map((org, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{org.name}</h4>
                      <Badge
                        variant={
                          org.status === 'completed' ? 'default' :
                          org.status === 'failed' ? 'destructive' :
                          org.isUndone ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {org.isUndone ? 'Undone' : org.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {org.filesProcessed} files • {formatDate(org.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentOrganization(org)
                        setShowResults(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {org.status === 'completed' && !org.isUndone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUndo(org.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organization Results Modal/View */}
      {showResults && currentOrganization && (
        <OrganizationView
          organization={currentOrganization}
          onClose={() => {
            setShowResults(false)
            setCurrentOrganization(null)
          }}
        />
      )}
    </div>
  )
}
