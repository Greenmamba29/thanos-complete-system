
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get total files count
    const totalFiles = await prisma.fileRecord.count({
      where: {
        isDeleted: false
      }
    })

    // Get organized files count
    const organizedFiles = await prisma.fileRecord.count({
      where: {
        isDeleted: false,
        organizationId: { not: null }
      }
    })

    // Get total organizations count
    const totalOrganizations = await prisma.organization.count({
      where: {
        status: 'completed'
      }
    })

    // Calculate average processing time (mock data for now)
    const avgProcessingTime = Math.floor(Math.random() * 10) + 2 // 2-12 seconds

    return NextResponse.json({
      totalFiles,
      organizedFiles,
      totalOrganizations,
      avgProcessingTime
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
