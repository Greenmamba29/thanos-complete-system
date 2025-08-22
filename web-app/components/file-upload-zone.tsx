
'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { UploadedFile } from '@/lib/types'
import { formatFileSize, generateUniqueId } from '@/lib/utils'

interface FileUploadZoneProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
}

export default function FileUploadZone({ onFilesUploaded }: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }, [])

  const handleFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return

    const newUploadedFiles: UploadedFile[] = fileList.map(file => ({
      file,
      id: generateUniqueId(),
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newUploadedFiles])
    setIsUploading(true)

    try {
      for (const uploadedFile of newUploadedFiles) {
        await uploadSingleFile(uploadedFile)
      }

      onFilesUploaded?.(files.filter(f => f.status === 'completed'))
      
      toast({
        title: 'Files uploaded successfully',
        description: `${newUploadedFiles.length} files ready for organization`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'Some files could not be uploaded',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const uploadSingleFile = async (uploadedFile: UploadedFile) => {
    const formData = new FormData()
    formData.append('file', uploadedFile.file)

    setFiles(prev => prev.map(f => 
      f.id === uploadedFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ))

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id && f.progress < 90
            ? { ...f, progress: f.progress + Math.random() * 30 }
            : f
        ))
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()

      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              metadata: result.metadata 
            }
          : f
      ))
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'failed', 
              error: 'Upload failed' 
            }
          : f
      ))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearAllFiles = () => {
    setFiles([])
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="h-fit">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Upload Zone */}
          <motion.div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${isDragActive 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileInputChange}
              accept="*/*"
            />

            <motion.div
              initial={false}
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Upload className={`h-12 w-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {isDragActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary rounded-full opacity-20"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop your files here' : 'Upload your files'}
                </h3>
                <p className="text-muted-foreground">
                  Drag and drop your files here, or click to browse
                </p>
              </div>

              <Button 
                onClick={openFilePicker}
                variant="outline"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Uploaded Files ({files.length})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                    >
                      <div className="flex-shrink-0">
                        <File className="h-8 w-8 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {file.file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.file.size)}
                            </span>
                            {file.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {file.status === 'failed' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            {file.status === 'uploading' && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="h-auto p-1 hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {(file.status === 'uploading' || file.status === 'processing') && (
                          <Progress value={file.progress} className="h-1" />
                        )}

                        {file.error && (
                          <p className="text-xs text-red-500 mt-1">{file.error}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
