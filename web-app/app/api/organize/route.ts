
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { moveFileToOrganized, listFilesInDirectory } from '@/lib/file-storage'
import { AIClassificationRequest, AIClassificationResponse } from '@/lib/types'
import { sanitizeFileName, createFolderPath } from '@/lib/utils'
import path from 'path'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Start organization process
        const job = await prisma.processingJob.create({
          data: {
            status: 'processing',
            progress: 0,
            message: 'Starting organization...'
          }
        })

        // Send initial progress
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'processing',
          progress: 5,
          message: 'Loading files...'
        })}\n\n`))

        // Get unorganized files
        const unorganizedFiles = await prisma.fileRecord.findMany({
          where: {
            organizationId: null,
            isDeleted: false
          }
        })

        if (unorganizedFiles.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'completed',
            result: {
              id: 'no-files',
              name: 'No Files to Organize',
              description: 'No unorganized files found',
              status: 'completed',
              filesProcessed: 0,
              totalFiles: 0,
              beforeSnapshot: [],
              afterSnapshot: [],
              createdAt: new Date(),
              isUndone: false
            }
          })}\n\n`))
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
          return
        }

        // Create organization record
        const organization = await prisma.organization.create({
          data: {
            name: `Organization ${new Date().toLocaleDateString()}`,
            description: `Organized ${unorganizedFiles.length} files`,
            status: 'processing',
            totalFiles: unorganizedFiles.length,
            filesProcessed: 0,
            beforeSnapshot: JSON.stringify(unorganizedFiles.map(f => ({
              name: f.originalName,
              originalName: f.originalName,
              path: f.originalPath,
              size: f.fileSize,
              type: f.fileType,
              mimeType: f.mimeType,
              lastModified: f.uploadedAt,
              category: f.category
            }))),
            afterSnapshot: JSON.stringify([])
          }
        })

        let processedCount = 0
        const organizedFiles = []

        // Process each file
        for (const file of unorganizedFiles) {
          try {
            // Send progress update
            const progress = Math.floor((processedCount / unorganizedFiles.length) * 80) + 10
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'processing',
              progress,
              message: `Processing ${file.originalName}...`
            })}\n\n`))

            // Classify file using AI
            const classification = await classifyFileWithAI({
              fileName: file.originalName,
              fileType: file.fileType,
              mimeType: file.mimeType,
              fileSize: file.fileSize
            })

            // Generate new filename and path
            const newFileName = sanitizeFileName(classification.suggestedName || file.originalName)
            const newPath = await moveFileToOrganized(
              file.currentPath,
              classification.category,
              classification.subcategory,
              newFileName
            )

            // Update file record
            await prisma.fileRecord.update({
              where: { id: file.id },
              data: {
                currentPath: newPath,
                currentName: newFileName,
                category: classification.category,
                subcategory: classification.subcategory,
                tags: JSON.stringify(classification.tags),
                organizationId: organization.id
              }
            })

            organizedFiles.push({
              name: newFileName,
              originalName: file.originalName,
              path: newPath,
              size: file.fileSize,
              type: file.fileType,
              mimeType: file.mimeType,
              lastModified: file.uploadedAt,
              category: classification.category,
              subcategory: classification.subcategory,
              tags: classification.tags
            })

            processedCount++

          } catch (error) {
            console.error(`Error processing file ${file.originalName}:`, error)
            // Continue with next file
          }
        }

        // Update organization with results
        const updatedOrg = await prisma.organization.update({
          where: { id: organization.id },
          data: {
            status: 'completed',
            filesProcessed: processedCount,
            afterSnapshot: JSON.stringify(organizedFiles)
          },
          include: {
            files: true
          }
        })

        // Send completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'completed',
          result: {
            id: updatedOrg.id,
            name: updatedOrg.name,
            description: updatedOrg.description || '',
            status: updatedOrg.status,
            filesProcessed: updatedOrg.filesProcessed,
            totalFiles: updatedOrg.totalFiles,
            beforeSnapshot: JSON.parse(updatedOrg.beforeSnapshot),
            afterSnapshot: JSON.parse(updatedOrg.afterSnapshot),
            createdAt: updatedOrg.createdAt,
            isUndone: updatedOrg.isUndone
          }
        })}\n\n`))

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))

      } catch (error) {
        console.error('Organization error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'error',
          message: 'Organization failed'
        })}\n\n`))
      } finally {
        await prisma.$disconnect()
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

async function classifyFileWithAI(request: AIClassificationRequest): Promise<AIClassificationResponse> {
  try {
    const messages = [{
      role: "user" as const,
      content: `Please analyze this file and provide classification information in JSON format:

Filename: ${request.fileName}
File Type: ${request.fileType}
MIME Type: ${request.mimeType}
File Size: ${request.fileSize} bytes

Please respond in JSON format with the following structure:
{
  "category": "Category name (Images, Documents, PDFs, Videos, Audio, etc.)",
  "subcategory": "More specific category (optional)",
  "suggestedName": "Improved filename if needed",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification"
}

Available categories: Images, Documents, PDFs, Spreadsheets, Presentations, Videos, Audio, Archives, Code, Other

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
    }]

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error('AI classification failed')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in AI response')
    }

    const result = JSON.parse(content) as AIClassificationResponse

    // Validate and provide fallbacks
    return {
      category: result.category || 'Other',
      subcategory: result.subcategory || '',
      suggestedName: result.suggestedName || request.fileName,
      tags: result.tags || [],
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'Auto-classified based on file type'
    }

  } catch (error) {
    console.error('AI classification error:', error)
    
    // Fallback classification based on MIME type
    let category = 'Other'
    if (request.mimeType.startsWith('image/')) category = 'Images'
    else if (request.mimeType.startsWith('video/')) category = 'Videos'
    else if (request.mimeType.startsWith('audio/')) category = 'Audio'
    else if (request.mimeType.includes('pdf')) category = 'PDFs'
    else if (request.mimeType.includes('document') || request.mimeType.includes('text')) category = 'Documents'

    return {
      category,
      subcategory: '',
      suggestedName: request.fileName,
      tags: [request.fileType],
      confidence: 0.3,
      reasoning: 'Fallback classification due to AI error'
    }
  }
}
