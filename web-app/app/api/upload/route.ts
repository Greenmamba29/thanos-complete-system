
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { saveUploadedFile, getFileStats } from '@/lib/file-storage'
import { generateUniqueId, sanitizeFileName, getMimeTypeCategory } from '@/lib/utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename to avoid conflicts
    const sanitizedName = sanitizeFileName(file.name)
    const uniqueFileName = `${Date.now()}_${sanitizedName}`

    // Save file to uploads directory
    const filePath = await saveUploadedFile(file, uniqueFileName)

    // Get file metadata
    const fileStats = await getFileStats(filePath)
    if (!fileStats) {
      return NextResponse.json({ error: 'Failed to get file stats' }, { status: 500 })
    }

    // Create file record in database
    const fileRecord = await prisma.fileRecord.create({
      data: {
        originalName: file.name,
        currentName: uniqueFileName,
        originalPath: filePath,
        currentPath: filePath,
        fileType: fileStats.type,
        fileSize: file.size,
        mimeType: file.type,
        category: getMimeTypeCategory(file.type),
        metadata: JSON.stringify({
          uploadedAt: new Date().toISOString(),
          originalSize: file.size,
          mimeType: file.type
        }),
        tags: JSON.stringify([])
      }
    })

    // Return success response with metadata
    return NextResponse.json({
      success: true,
      fileId: fileRecord.id,
      metadata: {
        name: file.name,
        originalName: file.name,
        path: filePath,
        size: file.size,
        type: fileStats.type,
        mimeType: file.type,
        lastModified: new Date(),
        category: getMimeTypeCategory(file.type)
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
