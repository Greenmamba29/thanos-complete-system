
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent 20 organizations
    })

    const formattedOrganizations = organizations.map(org => ({
      id: org.id,
      name: org.name,
      description: org.description || '',
      status: org.status,
      filesProcessed: org.filesProcessed,
      totalFiles: org.totalFiles,
      beforeSnapshot: JSON.parse(org.beforeSnapshot),
      afterSnapshot: JSON.parse(org.afterSnapshot),
      createdAt: org.createdAt,
      isUndone: org.isUndone
    }))

    return NextResponse.json({
      organizations: formattedOrganizations
    })

  } catch (error) {
    console.error('Organizations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
