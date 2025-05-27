# Radiance AI - Complete System Flow Chart Guide

## 1. User Authentication Flow

### Registration Process
```
START → Landing Page
├── Click "Get Started" / "Sign Up"
├── Registration Form
│   ├── Email Input
│   ├── Password Input
│   ├── Confirm Password
│   ├── Terms & Conditions Checkbox
│   └── Submit Registration
├── Email Verification
│   ├── Check Email Inbox
│   ├── Click Verification Link
│   └── Account Activated
├── Profile Setup
│   ├── Personal Information
│   │   ├── Full Name
│   │   ├── Date of Birth
│   │   ├── Gender
│   │   ├── Country/Location
│   │   ├── Height & Weight
│   │   └── Medical History
│   └── Save Profile
└── Redirect to Dashboard
```

### Login Process
```
START → Landing Page
├── Click "Sign In" / "Login"
├── Login Form
│   ├── Email Input
│   ├── Password Input
│   └── Submit Login
├── Authentication Check
│   ├── Valid Credentials → Dashboard
│   └── Invalid Credentials → Error Message
└── Optional: Forgot Password Flow
    ├── Enter Email
    ├── Reset Email Sent
    ├── Click Reset Link
    ├── New Password Form
    └── Password Updated
```

## 2. Main Navigation Flow

### Dashboard Navigation
```
Dashboard (Home)
├── Header Navigation
│   ├── RAI (Radiance AI Chat)
│   ├── Diagnosis
│   ├── History
│   └── Profile Menu
│       ├── Profile Settings
│       ├── File Manager
│       └── Logout
├── Quick Actions
│   ├── Start New Diagnosis
│   ├── Ask Radiance AI
│   ├── View History
│   └── Upload Files
└── Recent Activity
    ├── Recent Diagnoses
    ├── Recent Chats
    └── Health Metrics
```

## 3. Chain Diagnosis System Flow

### Complete Diagnosis Process
```
START → Diagnosis Page
├── Symptom Input Form
│   ├── Primary Symptoms (Text Area)
│   ├── Age Selection
│   ├── Gender Selection
│   ├── Duration of Symptoms
│   ├── Medical History (Optional)
│   ├── File Upload (Medical Reports/Images)
│   │   ├── Drag & Drop Interface
│   │   ├── File Browser Selection
│   │   ├── File Validation
│   │   └── Upload to Supabase Storage
│   └── Submit for Analysis
├── AI Analysis Chain (8 Steps)
│   ├── Step 1: Medical Analyst
│   │   ├── Analyze Uploaded Files
│   │   ├── Extract Medical Data
│   │   ├── Generate Medical Report Summary
│   │   └── API Call: Perplexity Sonar Pro
│   ├── Step 2: General Physician
│   │   ├── Review Symptoms + Medical Analyst Data
│   │   ├── Initial Diagnosis Assessment
│   │   ├── Primary Diagnosis Identification
│   │   └── API Call: Perplexity Sonar Pro
│   ├── Step 3: Specialist Doctor
│   │   ├── Review General Physician Assessment
│   │   ├── Specialized Medical Analysis
│   │   ├── Differential Diagnoses
│   │   └── API Call: Perplexity Sonar Reasoning Pro
│   ├── Step 4: Pathologist
│   │   ├── Analyze Test Results
│   │   ├── Laboratory Data Interpretation
│   │   ├── Pathological Insights
│   │   └── API Call: Perplexity Sonar Pro
│   ├── Step 5: Nutritionist
│   │   ├── Dietary Assessment
│   │   ├── Nutritional Recommendations
│   │   ├── Lifestyle Modifications
│   │   └── API Call: Perplexity Sonar Pro
│   ├── Step 6: Pharmacist
│   │   ├── Medication Recommendations
│   │   ├── Drug Interaction Analysis
│   │   ├── Dosage Guidelines
│   │   └── API Call: Perplexity Sonar Pro
│   ├── Step 7: Follow-up Specialist
│   │   ├── Care Plan Development
│   │   ├── Follow-up Recommendations
│   │   ├── Monitoring Guidelines
│   │   └── API Call: Perplexity Sonar Pro
│   └── Step 8: Radiance AI Summarizer
│       ├── Integrate All Expert Opinions
│       ├── Generate Comprehensive Care Plan
│       ├── Final Recommendations
│       └── API Call: Perplexity Sonar Deep Research
├── Results Display
│   ├── Executive Summary
│   ├── Primary Diagnosis with ICD Code
│   ├── Differential Diagnoses
│   ├── Treatment Recommendations
│   ├── Medication Suggestions
│   ├── Lifestyle & Dietary Advice
│   ├── Follow-up Care Plan
│   └── Medical Disclaimer
├── Save to Database
│   ├── Store Complete Session
│   ├── Save All AI Responses
│   ├── Update User History
│   └── Generate Session ID
└── Post-Diagnosis Actions
    ├── Download Report (PDF)
    ├── Share Results
    ├── Start New Diagnosis
    ├── Ask Follow-up Questions
    └── Return to Dashboard
```

## 4. Standalone Ask Radiance AI Flow

### Chat Interface Process
```
START → Ask Radiance Page
├── Chat Interface Initialization
│   ├── Load Existing Session
│   ├── Create New Session (if none exists)
│   ├── Load Chat History
│   └── Initialize Speech Recognition
├── User Input Options
│   ├── Text Input
│   │   ├── Type Message
│   │   ├── File Attachment (Optional)
│   │   └── Send Message
│   ├── Speech Input
│   │   ├── Click Microphone Icon
│   │   ├── Start Speech Recognition
│   │   ├── Live Transcription Display
│   │   ├── Auto-submit or Manual Send
│   │   └── Stop Recording
│   └── Voice Assistant Mode
│       ├── Toggle Voice Assistant
│       ├── Continuous Listening
│       ├── 10-Second Auto-timeout
│       ├── Auto-submit Messages
│       └── Auto-play TTS Responses
├── Message Processing
│   ├── Save User Message to Database
│   ├── API Call to Perplexity Sonar Pro
│   ├── Stream AI Response (Real-time)
│   ├── Save AI Response to Database
│   └── Update Chat Interface
├── TTS (Text-to-Speech) Integration
│   ├── Check TTS Cache
│   ├── Generate Audio (if not cached)
│   │   ├── Split Text into Chunks (300 chars)
│   │   ├── API Call to TTS Vibes
│   │   ├── Convert to Audio Base64
│   │   └── Save to Cache Database
│   ├── Audio Playback Controls
│   │   ├── Play/Pause Button
│   │   ├── Audio Progress Bar
│   │   └── Volume Control
│   └── Auto-play in Voice Assistant Mode
├── File Upload Integration
│   ├── Click Attachment Icon
│   ├── File Manager Dialog
│   ├── Select/Upload Files
│   ├── Include in Message Context
│   └── AI Analysis of Files
└── Chat Management
    ├── Clear Chat History
    ├── Export Chat
    ├── Search Messages
    └── Session Management
```

## 5. Voice Assistant Flow

### Voice Interaction Process
```
START → Voice Assistant Toggle
├── Enable Voice Assistant Mode
│   ├── Initialize Speech Recognition
│   ├── Start Continuous Listening
│   ├── Display Voice Status Indicator
│   └── Set Auto-response Mode
├── Speech Recognition Cycle
│   ├── Listen for Speech
│   ├── Real-time Transcription
│   ├── 10-Second Silence Timeout
│   ├── Auto-submit Message
│   └── Wait for AI Response
├── AI Response Processing
│   ├── Generate AI Response
│   ├── Display Text Response
│   ├── Auto-convert to Speech (TTS)
│   ├── Play Audio Response
│   └── Resume Listening After Audio
├── Continuous Loop
│   ├── Audio Playback Complete
│   ├── Restart Speech Recognition
│   ├── Wait for Next User Input
│   └── Repeat Cycle
└── Disable Voice Assistant
    ├── Stop Speech Recognition
    ├── Cancel Audio Playback
    ├── Return to Normal Chat Mode
    └── Manual Input/Output
```

## 6. File Management System Flow

### File Upload Process
```
START → File Upload Interface
├── Upload Methods
│   ├── Drag & Drop
│   │   ├── Drag Files to Drop Zone
│   │   ├── File Validation
│   │   ├── Preview Selected Files
│   │   └── Confirm Upload
│   ├── File Browser
│   │   ├── Click "Browse Files"
│   │   ├── Select Files from Device
│   │   ├── Multiple File Selection
│   │   └── Confirm Selection
│   └── Camera Capture (Mobile)
│       ├── Access Device Camera
│       ├── Take Photo/Video
│       ├── Preview Capture
│       └── Save to Upload Queue
├── File Processing
│   ├── File Type Validation
│   │   ├── Images: JPG, PNG, GIF, WebP
│   │   ├── Documents: PDF, DOC, DOCX, TXT
│   │   ├── Medical: DICOM, HL7
│   │   └── Size Limit Check (10MB)
│   ├── Upload to Supabase Storage
│   │   ├── Generate Unique File ID
│   │   ├── Create Storage Path
│   │   ├── Upload File Data
│   │   └── Generate Public URL
│   ├── Metadata Storage
│   │   ├── Save File Information
│   │   ├── User Association
│   │   ├── Upload Timestamp
│   │   └── File Categories
│   └── Progress Tracking
│       ├── Upload Progress Bar
│       ├── Success/Error Messages
│       └── Completion Notification
└── File Organization
    ├── Automatic Categorization
    │   ├── Images Folder
    │   ├── Documents Folder
    │   └── Medical Reports Folder
    ├── File Management Actions
    │   ├── View/Preview Files
    │   ├── Download Files
    │   ├── Delete Files
    │   └── Share Files
    └── Search & Filter
        ├── Search by Name
        ├── Filter by Type
        ├── Filter by Date
        └── Sort Options
```

## 7. TTS (Text-to-Speech) System Flow

### Audio Generation Process
```
START → TTS Request
├── Text Input Processing
│   ├── Receive Text Content
│   ├── Remove Markdown Formatting
│   ├── Clean Special Characters
│   └── Validate Text Length
├── Cache Check
│   ├── Generate Text Hash
│   ├── Query TTS Cache Database
│   ├── If Found: Return Cached Audio
│   └── If Not Found: Generate New Audio
├── Text Chunking
│   ├── Split Text (300 character limit)
│   ├── Preserve Word Boundaries
│   ├── Create Chunk Array
│   └── Calculate Word Counts
├── Audio Generation
│   ├── For Each Text Chunk:
│   │   ├── API Call to TTS Vibes
│   │   ├── Send Voice Parameters
│   │   ├── Receive Audio Response
│   │   ├── Convert to Base64
│   │   └── Store in Array
│   ├── Parallel Processing
│   ├── Error Handling for Failed Chunks
│   └── Combine Successful Chunks
├── Cache Storage
│   ├── Save to TTS Cache Database
│   ├── Store Text Hash
│   ├── Store Audio Chunks
│   ├── Store Metadata
│   └── Set Expiration
├── Audio Playback
│   ├── Create Audio Elements
│   ├── Queue Audio Chunks
│   ├── Sequential Playback
│   ├── Progress Tracking
│   └── Playback Controls
└── Cache Management
    ├── Clear Expired Cache
    ├── Clear User-specific Cache
    ├── Cache Statistics
    └── Storage Optimization
```

## 8. Database Operations Flow

### Data Storage & Retrieval
```
START → Database Operation
├── User Data Management
│   ├── Profile Information
│   │   ├── Personal Details
│   │   ├── Health Metrics
│   │   ├── Medical History
│   │   └── Preferences
│   ├── Authentication Data
│   │   ├── User Credentials
│   │   ├── Session Tokens
│   │   ├── Password Resets
│   │   └── Email Verification
│   └── Privacy Settings
│       ├── Data Sharing Preferences
│       ├── Communication Settings
│       └── Account Visibility
├── Diagnosis Data Storage
│   ├── Chain Diagnosis Sessions
│   │   ├── Session Metadata
│   │   ├── User Input Data
│   │   ├── AI Response Data (8 Steps)
│   │   ├── Session Status
│   │   └── Error Handling
│   ├── Chat Messages
│   │   ├── User Messages
│   │   ├── AI Responses
│   │   ├── Message Timestamps
│   │   ├── Session Association
│   │   └── File Attachments
│   └── Historical Records
│       ├── Diagnosis History
│       ├── Chat History
│       ├── File Upload History
│       └── User Activity Logs
├── File Storage Management
│   ├── File Metadata
│   │   ├── File Information
│   │   ├── Storage Paths
│   │   ├── Access Permissions
│   │   └── File Categories
│   ├── Supabase Storage
│   │   ├── Secure File Upload
│   │   ├── Public URL Generation
│   │   ├── Access Control
│   │   └── File Versioning
│   └── Cache Management
│       ├── TTS Audio Cache
│       ├── File Preview Cache
│       ├── API Response Cache
│       └── Session Data Cache
└── Data Security
    ├── Encryption at Rest
    ├── Secure Transmission
    ├── Access Control Lists
    ├── Audit Logging
    └── Data Backup & Recovery
```

## 9. API Integration Flow

### Perplexity API Integration
```
START → API Request
├── Request Preparation
│   ├── Format User Input
│   ├── Prepare System Prompt
│   ├── Add Context Data
│   ├── Set Model Parameters
│   └── Authentication Headers
├── API Call Execution
│   ├── HTTP POST Request
│   ├── Endpoint Selection
│   │   ├── sonar-pro (General/Specialist)
│   │   ├── sonar-reasoning-pro (Specialist Doctor)
│   │   └── sonar-deep-research (Summarizer)
│   ├── Request Payload
│   │   ├── Model Selection
│   │   ├── Messages Array
│   │   ├── Temperature Setting
│   │   ├── Max Tokens Limit
│   │   └── Stream Parameter
│   └── Error Handling
│       ├── Network Errors
│       ├── API Rate Limits
│       ├── Authentication Errors
│       └── Response Validation
├── Response Processing
│   ├── Stream Handling (if enabled)
│   │   ├── Real-time Text Display
│   │   ├── Chunk Processing
│   │   ├── UI Updates
│   │   └── Complete Response Assembly
│   ├── JSON Parsing
│   │   ├── Extract AI Response
│   │   ├── Parse Structured Data
│   │   ├── Validate Response Format
│   │   └── Error Detection
│   └── Data Transformation
│       ├── Format for Database
│       ├── Extract Key Information
│       ├── Generate Metadata
│       └── Prepare for UI Display
└── Response Storage
    ├── Save to Database
    ├── Update Session Status
    ├── Log API Usage
    └── Return to Application
```

### TTS Vibes API Integration
```
START → TTS Request
├── Request Preparation
│   ├── Text Preprocessing
│   ├── Voice Selection
│   ├── Chunk Text (300 chars)
│   └── Form Data Creation
├── API Call to TTS Vibes
│   ├── POST to ttsvibes.com
│   ├── Form Data Submission
│   ├── Voice Parameters
│   └── Request Headers
├── Response Handling
│   ├── Audio Data Reception
│   ├── Base64 Conversion
│   ├── Quality Validation
│   └── Error Handling
└── Audio Processing
    ├── Chunk Assembly
    ├── Cache Storage
    ├── Playback Preparation
    └── Return Audio Data
```

## 10. Error Handling & Recovery Flow

### System Error Management
```
START → Error Detection
├── Error Types
│   ├── Network Errors
│   │   ├── Connection Timeout
│   │   ├── API Unavailable
│   │   ├── Rate Limiting
│   │   └── Authentication Failure
│   ├── Database Errors
│   │   ├── Connection Issues
│   │   ├── Query Failures
│   │   ├── Data Validation Errors
│   │   └── Storage Limits
│   ├── File Upload Errors
│   │   ├── File Size Exceeded
│   │   ├── Invalid File Type
│   │   ├── Upload Timeout
│   │   └── Storage Quota
│   └── Speech Recognition Errors
│       ├── Microphone Access Denied
│       ├── Browser Compatibility
│       ├── Network Issues
│       └── Recognition Timeout
├── Error Response
│   ├── User Notification
│   │   ├── Error Message Display
│   │   ├── Suggested Actions
│   │   ├── Retry Options
│   │   └── Support Contact
│   ├── Fallback Mechanisms
│   │   ├── Offline Mode
│   │   ├── Cached Data Usage
│   │   ├── Alternative APIs
│   │   └── Simplified Features
│   └── Recovery Actions
│       ├── Automatic Retry
│       ├── Session Restoration
│       ├── Data Recovery
│       └── State Synchronization
└── Logging & Monitoring
    ├── Error Logging
    ├── Performance Metrics
    ├── User Impact Analysis
    └── System Health Monitoring
```

## 11. Mobile & Responsive Flow

### Mobile Experience
```
START → Mobile Access
├── Responsive Design
│   ├── Screen Size Detection
│   ├── Layout Adaptation
│   ├── Touch Optimization
│   └── Mobile Navigation
├── Mobile-Specific Features
│   ├── Camera Integration
│   │   ├── Photo Capture
│   │   ├── Document Scanning
│   │   ├── Real-time Preview
│   │   └── Upload Integration
│   ├── Voice Features
│   │   ├── Mobile Speech Recognition
│   │   ├── Background Audio
│   │   ├── Notification Sounds
│   │   └── Hands-free Operation
│   └── Offline Capabilities
│       ├── Service Worker
│       ├── Cache Management
│       ├── Offline Notifications
│       └── Sync on Reconnect
├── Performance Optimization
│   ├── Image Compression
│   ├── Lazy Loading
│   ├── Reduced Animations
│   └── Bandwidth Management
└── Mobile Navigation
    ├── Bottom Navigation
    ├── Swipe Gestures
    ├── Pull-to-Refresh
    └── Mobile Menu
```

## 12. Security & Privacy Flow

### Data Protection Process
```
START → Security Check
├── Authentication Security
│   ├── Password Encryption
│   ├── Session Management
│   ├── Multi-factor Authentication
│   └── Account Lockout Protection
├── Data Encryption
│   ├── Data in Transit (HTTPS)
│   ├── Data at Rest (Database)
│   ├── File Encryption
│   └── API Key Protection
├── Privacy Controls
│   ├── Data Minimization
│   ├── User Consent Management
│   ├── Data Retention Policies
│   └── Right to Deletion
├── Access Control
│   ├── Role-based Permissions
│   ├── Resource Authorization
│   ├── API Rate Limiting
│   └── Audit Trail
└── Compliance
    ├── HIPAA Compliance
    ├── GDPR Compliance
    ├── Data Processing Agreements
    └── Regular Security Audits
```

## Flow Chart Creation Guidelines

### Recommended Tools for Visualization:
1. **Lucidchart** - Professional flowcharts with medical symbols
2. **Draw.io (diagrams.net)** - Free online diagramming tool
3. **Miro** - Collaborative whiteboard with flowchart templates
4. **Microsoft Visio** - Enterprise-grade diagramming
5. **Figma** - Design tool with flowchart capabilities

### Visual Design Recommendations:
- Use different colors for different system components
- Add icons for user actions, AI processes, and data storage
- Include decision diamonds for conditional flows
- Use swimlanes to separate user, system, and external API actions
- Add timing indicators for long-running processes
- Include error paths and recovery flows

### Key Symbols to Use:
- 🟢 Start/End points
- 🔵 Process steps
- 🔶 Decision points
- 🟡 User input/actions
- 🟣 AI processing
- 🔴 Error handling
- 📊 Data storage
- 🌐 External API calls
