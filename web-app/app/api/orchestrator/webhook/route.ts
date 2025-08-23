
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Webhook endpoint for SnapOrchestrator responses
 * This endpoint receives orchestration results from Abacus AI
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Validate webhook signature (implement your signature validation here)
    const signature = request.headers.get('x-abacus-signature')
    if (!validateWebhookSignature(signature, payload)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Extract job information from payload
    const {
      job_id,
      status,
      summary,
      results,
      errors
    } = payload

    // Update the organization record with orchestrator results
    if (job_id) {
      await updateOrganizationWithResults(job_id, {
        status,
        summary,
        results,
        errors
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Validate webhook signature from Abacus AI
 */
function validateWebhookSignature(signature: string | null, payload: any): boolean {
  // Implement signature validation logic here
  // This should verify that the request is from Abacus AI
  
  if (!signature) {
    return false
  }

  // For now, basic validation - in production, implement proper HMAC verification
  return signature.startsWith('sha256=')
}

/**
 * Update organization record with orchestrator results
 */
async function updateOrganizationWithResults(
  jobId: string,
  results: {
    status: string
    summary?: any
    results?: any
    errors?: string[]
  }
) {
  try {
    // Find organization by job ID (you might need to adjust this based on your schema)
    const organization = await prisma.organization.findFirst({
      where: {
        // Assuming you store job_id somewhere in your organization record
        description: {
          contains: jobId
        }
      }
    })

    if (!organization) {
      console.error(`Organization not found for job_id: ${jobId}`)
      return
    }

    // Update organization with orchestrator results
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        status: results.status === 'completed' ? 'completed' : 'failed',
        // Store orchestrator results in a metadata field if you have one
        // metadata: JSON.stringify(results)
      }
    })

    // If you have a separate job tracking table, update it here
    // await prisma.processingJob.update({
    //   where: { externalJobId: jobId },
    //   data: { status: results.status }
    // })

  } catch (error) {
    console.error('Error updating organization with results:', error)
  }
}

/**
 * GET handler for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'THANOS SnapOrchestrator Webhook',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}
