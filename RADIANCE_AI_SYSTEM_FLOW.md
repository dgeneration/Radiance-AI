# Radiance AI - System Flow Architecture

## Overview
Complete end-to-end system flow showing how user input flows through AI processing to deliver health assessments.

## Tech Stack
**Frontend:** Next.js 15.3.1, TypeScript, TailwindCSS, React Hook Form, Web Speech API
**Backend:** Supabase (PostgreSQL, Auth, Storage), Next.js API Routes
**AI APIs:** Perplexity Sonar (sonar-pro, sonar-reasoning-pro, sonar-deep-research), TTS Vibes
**Deployment:** Vercel

## 1. Main System Flow

### User Input → AI Processing → Results
```
USER INPUT
├── Symptoms, Age, Gender, Duration, Medical History
├── File Uploads (medical reports/images) → Supabase Storage
├── Voice Input (Web Speech API) → Text conversion
└── Form Validation (React Hook Form + Zod)

                           ↓

SESSION CREATION
├── PostgreSQL: chain_diagnosis_sessions table
├── Store user input as JSONB
├── Generate UUID session ID
└── Set status: "in_progress"

                           ↓

AI PROCESSING CHAIN (8 Steps)
├── Step 1: Medical Analyst (Perplexity Sonar Pro)
│   └── Analyze uploaded files → medical_findings, key_abnormalities
├── Step 2: General Physician (Perplexity Sonar Pro)
│   └── Initial assessment → primary_assessment, differential_diagnoses
├── Step 3: Specialist Doctor (Perplexity Sonar Reasoning Pro)
│   └── Specialized analysis → detailed_diagnosis, treatment_recommendations
├── Step 4: Pathologist (Perplexity Sonar Pro)
│   └── Lab analysis → pathological_findings, recommended_tests
├── Step 5: Nutritionist (Perplexity Sonar Pro)
│   └── Dietary guidance → dietary_recommendations, nutritional_supplements
├── Step 6: Pharmacist (Perplexity Sonar Pro)
│   └── Medication analysis → recommended_medications, drug_interactions
├── Step 7: Follow-up Specialist (Perplexity Sonar Pro)
│   └── Care planning → follow_up_schedule, monitoring_plan
└── Step 8: Radiance AI Summarizer (Perplexity Sonar Deep Research)
    └── Final integration → comprehensive_care_plan, patient_education

                           ↓

RESULTS DELIVERY
├── Real-time UI updates (React state management)
├── Comprehensive diagnosis report
├── TTS audio conversion (TTS Vibes API)
├── Database storage (PostgreSQL JSONB)
└── Downloadable reports
```

## 2. Database & Storage

### Key Tables
```
chain_diagnosis_sessions
├── id (UUID), user_id (UUID), created_at
├── user_input (JSONB) - Original symptoms/data
├── medical_analyst_response (JSONB) - Step 1 results
├── general_physician_response (JSONB) - Step 2 results
├── specialist_doctor_response (JSONB) - Step 3 results
├── pathologist_response (JSONB) - Step 4 results
├── nutritionist_response (JSONB) - Step 5 results
├── pharmacist_response (JSONB) - Step 6 results
├── follow_up_specialist_response (JSONB) - Step 7 results
├── summarizer_response (JSONB) - Step 8 final results
├── status (TEXT) - Progress tracking
└── current_step (INTEGER) - Current AI step

standalone_radiance_chat_sessions & standalone_radiance_chat_messages
├── Chat session management
└── Message history storage

file_metadata & Supabase Storage
├── File upload metadata
├── Supabase "medical-reports" bucket
└── Row Level Security (RLS) for user isolation

tts_audio_cache
├── text_hash (SHA-256) - Cache key
├── audio_chunks (JSONB) - Base64 audio data
└── Automatic cache expiration
```

## 3. Voice & TTS System

### Speech Processing Flow
```
SPEECH-TO-TEXT (Web Speech API)
├── Continuous listening mode
├── Real-time transcription
├── 10-second auto-timeout
└── Voice Assistant integration

                           ↓

TEXT-TO-SPEECH (TTS Vibes API)
├── Text preprocessing (remove markdown)
├── 300-character chunking
├── Cache check (SHA-256 hash)
├── Parallel audio generation
├── Database cache storage
└── HTML5 Audio playback with controls
```

## 4. Chat & File Systems

### Standalone Chat Flow
```
User Input → Save to DB → Perplexity Sonar Pro → Stream Response → Save AI Response → Optional TTS

Components: StandaloneAskRadiance.tsx, ChatMessage.tsx, FileSelector.tsx
Tables: standalone_radiance_chat_sessions, standalone_radiance_chat_messages
```

### File Upload System
```
Drag & Drop → Validation → Supabase Storage → Metadata DB → Public URL Generation

Supported: Images (JPG, PNG, GIF, WebP), Documents (PDF, DOC, TXT), Medical (DICOM)
Size Limit: 10MB | Security: RLS policies, user-based access control
```

## 5. API Configuration

### Perplexity Models
```
sonar-pro: "llama-3.1-sonar-large-128k-online"
├── General medical analysis (Steps 1,2,4,5,6,7)
├── Standalone chat responses
└── Temperature: 0.1, Max Tokens: 4000-8000

sonar-reasoning-pro: "llama-3.1-sonar-huge-128k-online"
├── Specialist doctor analysis (Step 3)
└── Enhanced reasoning capabilities

sonar-deep-research: "llama-3.1-sonar-large-128k-online"
├── Final summarization (Step 8)
└── Comprehensive research and synthesis
```

## 6. Complete System Overview

### End-to-End Flow
```
USER INPUT (Web/Mobile/Voice)
    ↓
INPUT PROCESSING (Validation, File Upload, Speech-to-Text)
    ↓
AI PROCESSING (8-Step Chain via Perplexity API)
    ↓
DATA STORAGE (PostgreSQL JSONB, Supabase Storage)
    ↓
RESPONSE DELIVERY (UI Updates, TTS Audio, Reports)
```

### Deployment
**Platform:** Vercel (Next.js 15.3.1)
**Database:** Supabase (PostgreSQL + Auth + Storage)
**APIs:** Perplexity Sonar, TTS Vibes, Web Speech API
**Security:** HTTPS, RLS, API key protection, CORS
