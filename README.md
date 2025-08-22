
# 🧰 THANOS: One-Click File Organization System

**Transform chaos into perfect organization with a single click.**

THANOS is a comprehensive file organization system that combines AI-powered classification, smart folder creation, and automated orchestration to turn thousands of unorganized files into a perfectly structured filing system.

## 🌟 Features

### Core Functionality
- **One-Click Organization**: Transform thousands of files with a single button press
- **AI-Powered Classification**: Intelligent file categorization using advanced AI
- **Smart Folder Creation**: Automatic generation of logical folder structures  
- **Real-Time Processing**: Live progress tracking and status updates
- **Undo Functionality**: Complete rollback capability for all operations
- **Multi-Tier Support**: Different processing levels (Standard, Pro, Veteran)

### File Processing Capabilities
- **Metadata Extraction**: EXIF data, timestamps, GPS coordinates
- **Content Analysis**: OCR for documents and images
- **Face Recognition**: People identification and matching
- **Voice Processing**: Audio transcription and classification
- **Document Analysis**: PDF, DOCX, and text content extraction

## 🏗️ Architecture

```
thanos-complete-system/
├── web-app/                    # Next.js Web Application
│   ├── app/                    # Next.js App Router
│   ├── components/             # React Components
│   ├── lib/                    # Utilities and Types
│   └── api/                    # API Routes
├── agents/                     # Abacus AI Orchestration Agents
│   ├── orchestrator/           # Main SnapOrchestrator Agent
│   ├── tools/                  # Individual Processing Tools
│   └── config/                 # Agent Configuration
├── docs/                       # Documentation
└── deploy/                     # Deployment Scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Abacus AI account
- S3 bucket for file storage

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd thanos-complete-system
```

2. **Set up the web application**
```bash
cd web-app
yarn install
cp .env.example .env.local
# Configure your environment variables
```

3. **Start the development server**
```bash
yarn dev
```

4. **Deploy agents to Abacus AI**
- Import agent configurations from `agents/` directory
- Configure your Abacus AI project with provided schemas

### Environment Variables

```bash
# S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name

# Abacus AI Integration
ABACUS_API_KEY=your_api_key
ABACUS_PROJECT_ID=your_project_id

# Database
DATABASE_URL=your_database_url
```

## 🔧 Agent Orchestration

The THANOS system uses a sophisticated agent orchestration pipeline:

### 1. SnapOrchestrator (Main Agent)
- **Purpose**: Coordinates the entire file processing pipeline
- **Input**: Job configuration, file scope, user preferences
- **Output**: Organization summary, folder structure, audit trail

### 2. Processing Tools
- `guard_rail`: Pre-flight safety checks and quota validation
- `list_files`: File enumeration and pagination
- `extract_exif`: GPS, timestamp, and camera metadata
- `extract_text`: OCR for documents and images
- `detect_faces`: Face recognition and embedding generation
- `people_match`: Face matching against known individuals
- `classify_file`: AI-powered content classification
- `suggest_folder`: Smart folder path generation
- `move_file`: Atomic file operations with undo support

### 3. Orchestration Flow
```
Safety Check → File Discovery → Metadata Extraction → 
AI Classification → Folder Planning → File Organization → 
Tagging & Indexing → Audit Logging
```

## 📱 Web Application

### Core Components

#### THANOS Button
The centerpiece of the system - a single button that triggers the complete organization process.

```typescript
// Core organization trigger
const handleOrganize = async () => {
  const result = await fetch('/api/organize', {
    method: 'POST',
    body: JSON.stringify({ scope, dryRun, tier })
  });
  // Real-time progress tracking
  trackProgress(result.jobId);
};
```

#### Dashboard Features
- **File Upload Zone**: Drag-and-drop interface for new files
- **Organization Panel**: Real-time progress and results
- **Before/After View**: Visual comparison of organization
- **Stats Overview**: Processing metrics and insights
- **Undo Management**: Complete rollback capabilities

### API Endpoints

| Endpoint | Method | Purpose |
|----------|---------|---------|
| `/api/organize` | POST | Trigger organization process |
| `/api/upload` | POST | Handle file uploads |
| `/api/stats` | GET | Get processing statistics |
| `/api/undo` | POST | Rollback operations |
| `/api/organizations` | GET | List organization jobs |

## 🤖 Agent Configuration

### Setting up in Abacus AI

1. **Create New Project**
   - Project Type: "Custom LLM Chat"
   - Name: "THANOS File Organizer"

2. **Import Agent Schemas**
   ```bash
   # Upload agent configurations from agents/ directory
   # Configure input/output schemas for each tool
   ```

3. **Configure Data Pipelines**
   - Upload `file_metadata_rules_v1` dataset
   - Set up feature groups for classification
   - Configure document retrievers

4. **Deploy Agents**
   - Deploy SnapOrchestrator as main agent
   - Deploy individual tools as functions
   - Test orchestration pipeline

## 📊 Demo Data

The system includes sample data for testing:
- 30+ diverse file types
- Mixed media content
- Realistic metadata variations
- Unorganized structure for demonstration

## 🔒 Security & Privacy

- **Secure File Handling**: All files processed with encryption
- **Privacy Protection**: No file content stored permanently
- **Audit Trail**: Complete operation logging
- **Access Control**: User-based permissions

## 🎯 Use Cases

- **Personal File Management**: Organize thousands of personal photos, documents
- **Enterprise Document Management**: Automate filing systems
- **Digital Asset Organization**: Media libraries and content archives
- **Research Data Management**: Academic and research file organization

## 🛠️ Development

### Running Tests
```bash
cd web-app
yarn test
```

### Building for Production
```bash
yarn build
yarn start
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📈 Scaling

The system supports scaling from 100 files to 10,000+ files:

- **Batch Processing**: Chunked file processing
- **Queue Management**: Background job processing
- **Progress Tracking**: Real-time status updates
- **Error Recovery**: Automatic retry mechanisms

## 🆘 Troubleshooting

### Common Issues

**Files not organizing properly**
- Check file permissions and access rights
- Verify S3 bucket configuration
- Review agent logs in Abacus AI

**Slow processing**
- Adjust batch sizes in configuration
- Check Abacus AI tier limits
- Monitor system resources

**API errors**
- Verify environment variables
- Check Abacus AI API key validity
- Review network connectivity

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

---

**Built with ❤️ using Next.js, Abacus AI, and modern web technologies**
