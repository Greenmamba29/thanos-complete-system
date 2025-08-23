
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Trigger SnapOrchestrator for file organization
 * This endpoint calls the Abacus AI orchestrator instead of doing local processing
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, tier = 'Standard', dryRun = false } = await request.json()

    if (!process.env.SNAP_ORCHESTRATOR_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'SnapOrchestrator webhook URL not configured' },
        { status: 500 }
      )
    }

    // Get the organization to process
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { files: true }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Prepare orchestrator payload
    const orchestratorPayload = {
      job_id: `thanos-${organization.id}-${Date.now()}`,
      user_id: 'user-id-placeholder', // Replace with actual user ID
      org_id: organization.id,
      tier: tier,
      scope: 'uploads/', // Adjust based on your file structure
      dry_run: dryRun,
      max_files: organization.totalFiles,
      preferences: {
        create_people_folders: true,
        create_date_folders: true,
        create_type_folders: true
      }
    }

    // Call SnapOrchestrator via Abacus AI
    const response = await fetch(process.env.SNAP_ORCHESTRATOR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        'X-Webhook-Source': 'thanos-system'
      },
      body: JSON.stringify(orchestratorPayload)
    })

    if (!response.ok) {
      throw new Error(`SnapOrchestrator call failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Update organization status to processing
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'processing',
        // Store job_id for webhook correlation
        description: `${organization.description} (Job: ${orchestratorPayload.job_id})`
      }
    })

    return NextResponse.json({
      success: true,
      jobId: orchestratorPayload.job_id,
      message: 'SnapOrchestrator triggered successfully',
      details: result
    })

  } catch (error) {
    console.error('SnapOrchestrator trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger orchestrator' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * GET handler to check orchestrator status
 */
export async function GET() {
  const isConfigured = !!process.env.SNAP_ORCHESTRATOR_WEBHOOK_URL

  return NextResponse.json({
    service: 'SnapOrchestrator Trigger',
    configured: isConfigured,
    webhookUrl: isConfigured ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  })
}
