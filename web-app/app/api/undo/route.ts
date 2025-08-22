
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { restoreFileFromOrganized } from '@/lib/file-storage'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get the organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { files: true }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (organization.isUndone) {
      return NextResponse.json({ error: 'Organization already undone' }, { status: 400 })
    }

    // Restore files to their original locations
    for (const file of organization.files) {
      try {
        // Move file back to original location
        await restoreFileFromOrganized(file.currentPath, file.originalPath)

        // Update file record
        await prisma.fileRecord.update({
          where: { id: file.id },
          data: {
            currentPath: file.originalPath,
            currentName: file.originalName,
            category: null,
            subcategory: null,
            tags: JSON.stringify([]),
            organizationId: null
          }
        })
      } catch (error) {
        console.error(`Error restoring file ${file.originalName}:`, error)
        // Continue with other files even if one fails
      }
    }

    // Mark organization as undone
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        isUndone: true,
        status: 'undone'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Organization undone successfully'
    })

  } catch (error) {
    console.error('Undo error:', error)
    return NextResponse.json(
      { error: 'Failed to undo organization' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
