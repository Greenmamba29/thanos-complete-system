
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Eye, 
  EyeOff, 
  File, 
  Folder, 
  ArrowRight,
  Calendar,
  HardDrive,
  Tag,
  Grid,
  List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrganizationResult, OrganizationView as ViewType } from '@/lib/types'
import { formatFileSize, formatDate, FILE_CATEGORIES } from '@/lib/utils'

interface OrganizationViewProps {
  organization: OrganizationResult
  onClose: () => void
}

export default function OrganizationView({ organization, onClose }: OrganizationViewProps) {
  const [view, setView] = useState<ViewType>('comparison')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const beforeFiles = organization.beforeSnapshot
  const afterFiles = organization.afterSnapshot
  
  // Group files by category for after view
  const categorizedFiles = afterFiles?.reduce((acc, file) => {
    const category = file.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(file)
    return acc
  }, {} as Record<string, typeof afterFiles>)

  const getCategoryInfo = (categoryName: string) => {
    return FILE_CATEGORIES.find(cat => cat.name === categoryName) || FILE_CATEGORIES.find(cat => cat.name === 'Other')!
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[90vh] bg-card rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{organization.name}</h2>
            <p className="text-muted-foreground">
              {formatDate(organization.createdAt)} • {organization.filesProcessed} files organized
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-6">
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="before" className="mt-6">
                <FileGrid files={beforeFiles} viewMode={viewMode} title="Original Files" />
              </TabsContent>

              <TabsContent value="comparison" className="mt-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <EyeOff className="h-5 w-5" />
                      Before (Chaotic)
                    </h3>
                    <FileGrid files={beforeFiles} viewMode="list" isCompact />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      After (Organized)
                    </h3>
                    <CategorizedView files={categorizedFiles} />
                  </div>
                </div>

                {/* Transformation Arrow */}
                <div className="flex justify-center my-8">
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-primary/10 p-4 rounded-full"
                  >
                    <ArrowRight className="h-8 w-8 text-primary" />
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="after" className="mt-6">
                <CategorizedView files={categorizedFiles} detailed />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  )
}

// File Grid Component
interface FileGridProps {
  files: any[]
  viewMode?: 'grid' | 'list'
  title?: string
  isCompact?: boolean
}

function FileGrid({ files, viewMode = 'grid', title, isCompact = false }: FileGridProps) {
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <File className="h-5 w-5" />
          {title}
        </h3>
      )}

      <div className={`
        ${viewMode === 'grid' 
          ? `grid gap-4 ${isCompact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`
          : 'space-y-2'
        }
      `}>
        {files?.map((file, index) => (
          <motion.div
            key={`${file.name}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors
              ${viewMode === 'list' ? 'flex items-center gap-3' : ''}
            `}
          >
            <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mb-2' : ''}`}>
              <File className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground`} />
              <p className={`font-medium truncate ${isCompact ? 'text-sm' : ''}`}>
                {file.name}
              </p>
            </div>

            {!isCompact && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{file.type?.toUpperCase()}</span>
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {file.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )) || []}
      </div>
    </div>
  )
}

// Categorized View Component
interface CategorizedViewProps {
  files: Record<string, any[]>
  detailed?: boolean
}

function CategorizedView({ files, detailed = false }: CategorizedViewProps) {
  return (
    <div className="space-y-4">
      {Object.entries(files || {}).map(([category, categoryFiles]) => {
        const categoryInfo = getCategoryInfo(category)
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${categoryInfo.color}20` }}
              >
                <Folder 
                  className="h-5 w-5" 
                  style={{ color: categoryInfo.color }}
                />
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <span>{categoryInfo.icon}</span>
                  {category}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {categoryFiles.length} files • {categoryInfo.description}
                </p>
              </div>

              <Badge variant="outline">
                {categoryFiles.length}
              </Badge>
            </div>

            {detailed && (
              <div className="ml-6 space-y-2">
                {categoryFiles.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded border bg-card/30 text-sm"
                  >
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function getCategoryInfo(categoryName: string) {
  return FILE_CATEGORIES.find(cat => cat.name === categoryName) || FILE_CATEGORIES.find(cat => cat.name === 'Other')!
}
