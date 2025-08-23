
# SnapOrchestrator Webhook Configuration Guide

## 🎯 Overview

The THANOS system includes a sophisticated SnapOrchestrator that handles advanced file organization using Abacus AI. This guide shows you where everything is located and how to configure the webhook integration.

## 📍 Where Are The Routes Located?

### **API Endpoints** (`web-app/app/api/`)

#### **Main Organization Routes:**
- 📁 `/api/organize` - Current local organization endpoint
- 📁 `/api/orchestrator/trigger` - **NEW** Triggers SnapOrchestrator via Abacus AI  
- 📁 `/api/orchestrator/webhook` - **NEW** Receives results from SnapOrchestrator
- 📁 `/api/upload` - File upload handling
- 📁 `/api/stats` - Organization statistics
- 📁 `/api/rosa` - Rosa chatbot endpoint

#### **Orchestrator Integration:**
```
web-app/app/api/orchestrator/
├── trigger/route.ts       # Triggers SnapOrchestrator
└── webhook/route.ts       # Receives orchestrator results
```

### **Agent Configuration** (`agents/`)

#### **SnapOrchestrator Configuration:**
```
agents/orchestrator/
└── snap-orchestrator.yaml    # Complete orchestrator configuration
```

#### **Processing Tools:**
```
agents/tools/
├── classify-file.py          # AI-powered file classification
├── suggest-folder.py         # Smart folder suggestions  
├── list-files.py            # File discovery
├── extract-exif.py          # Metadata extraction
└── guard-rail.py            # Safety checks
```

## ⚙️ Environment Variable Configuration

### **Required Environment Variable:**

Add this to your `.env` file:

```bash
# SnapOrchestrator Webhook URL (REQUIRED for production)
SNAP_ORCHESTRATOR_WEBHOOK_URL="https://api.abacus.ai/v1/webhooks/your-webhook-id"
```

### **Complete Environment Setup:**

```bash
# Copy the example environment file
cp web-app/.env.example web-app/.env

# Edit your environment file
nano web-app/.env
```

Your `.env` should include:

```bash
# Abacus AI Configuration
ABACUSAI_API_KEY="your-abacus-ai-api-key-here"

# SnapOrchestrator Webhook URL (THIS IS WHAT YOU NEED!)
SNAP_ORCHESTRATOR_WEBHOOK_URL="https://api.abacus.ai/v1/webhooks/your-webhook-id"

# Database Configuration  
DATABASE_URL="file:./prisma/dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## 🔄 How The Orchestration Works

### **Local vs. Orchestrator Processing:**

#### **Current Local Processing** (`/api/organize`):
1. User clicks THANOS button
2. Files processed locally using AI classification
3. Results returned immediately

#### **SnapOrchestrator Processing** (`/api/orchestrator/trigger`):
1. User clicks THANOS button (enhanced)
2. Request sent to SnapOrchestrator via Abacus AI
3. Advanced multi-tool pipeline processes files
4. Results sent back via webhook (`/api/orchestrator/webhook`)
5. Frontend updated with final results

### **Integration Flow:**

```mermaid
graph TD
    A[User Clicks THANOS] --> B[Trigger Orchestrator]
    B --> C[Call Abacus AI SnapOrchestrator]
    C --> D[Multi-Tool Processing Pipeline]
    D --> E[Safety Check]
    E --> F[File Discovery] 
    F --> G[Metadata Extraction]
    G --> H[AI Classification]
    H --> I[Folder Planning]
    I --> J[File Organization]
    J --> K[Indexing & Logging]
    K --> L[Results via Webhook]
    L --> M[Update Frontend]
```

## 🛠️ Setup Instructions

### **Step 1: Deploy Agents to Abacus AI**

```bash
cd thanos-complete-system

# Set environment variables
export ABACUS_API_KEY="your-api-key"
export ABACUS_PROJECT_ID="your-project-id"

# Deploy all agents
python scripts/deploy-agents.py
```

### **Step 2: Get Webhook URL**

After deploying the SnapOrchestrator agent, Abacus AI will provide you with:
- **Webhook URL** - Add this to `SNAP_ORCHESTRATOR_WEBHOOK_URL`
- **Agent ID** - For direct API calls
- **Project ID** - For managing the deployment

### **Step 3: Configure Environment**

```bash
# Add to your .env file
SNAP_ORCHESTRATOR_WEBHOOK_URL="https://api.abacus.ai/v1/webhooks/abc-123-def"
```

### **Step 4: Test Integration**

```bash
# Check if orchestrator is configured
curl http://localhost:3000/api/orchestrator/trigger

# Should return:
{
  "service": "SnapOrchestrator Trigger",
  "configured": true,
  "webhookUrl": "configured"
}
```

## 🎛️ Advanced Configuration

### **Tier-Based Processing:**

The orchestrator supports different processing tiers:

- **Standard**: Up to 100 files, 5 minutes
- **Pro**: Up to 1,000 files, 30 minutes, face recognition
- **Veteran**: Up to 10,000 files, 2 hours, all features

### **Custom Organization Preferences:**

```typescript
// Example API call with custom preferences
fetch('/api/orchestrator/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId: 'org-123',
    tier: 'Pro',
    dryRun: false,
    preferences: {
      create_people_folders: true,
      create_date_folders: true,
      create_type_folders: false
    }
  })
})
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **"Webhook URL not configured"**
   - Add `SNAP_ORCHESTRATOR_WEBHOOK_URL` to `.env`
   - Restart your development server

2. **"SnapOrchestrator call failed"**
   - Verify your `ABACUSAI_API_KEY`
   - Check if agents are deployed to Abacus AI
   - Ensure webhook URL is correct

3. **No webhook responses**
   - Verify webhook endpoint is accessible
   - Check Abacus AI logs for delivery issues
   - Ensure signature validation is working

### **Debug Mode:**

```bash
# Enable debug logging
DEBUG=thanos:orchestrator yarn dev
```

## 🚀 Production Deployment

### **Environment Variables for Production:**

```bash
# Production environment
SNAP_ORCHESTRATOR_WEBHOOK_URL="https://api.abacus.ai/v1/webhooks/prod-webhook-id"
ABACUSAI_API_KEY="prod-api-key"
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="postgresql://user:pass@host:port/db"
```

### **Webhook Security:**

Implement proper signature validation in production:

```typescript
// In webhook/route.ts
function validateWebhookSignature(signature: string, payload: any): boolean {
  const secret = process.env.ABACUS_WEBHOOK_SECRET
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return `sha256=${expectedSignature}` === signature
}
```

## 📊 Monitoring

### **Available Endpoints for Monitoring:**

- `GET /api/orchestrator/trigger` - Check configuration status
- `GET /api/orchestrator/webhook` - Webhook health check
- `GET /api/stats` - Organization statistics
- `GET /api/rosa` - Rosa chatbot status

---

**🎉 Your SnapOrchestrator integration is ready to use once you configure the webhook URL!**
