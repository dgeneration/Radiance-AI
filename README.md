# 🧠 Radiance AI - Intelligent Health Companion

## Project Overview

Radiance AI is an advanced AI-powered health diagnosis platform that leverages cutting-edge artificial intelligence to provide users with preliminary health assessments. The application uses the Perplexity Sonar API to analyze user-reported symptoms and medical data, offering detailed diagnostic insights, treatment recommendations, and medical guidance.

Designed with a focus on user privacy, data security, and medical accuracy, Radiance AI serves as a preliminary health assessment tool that can help users understand potential health concerns before consulting with healthcare professionals.

## Key Features

### 🩺 AI-Powered Diagnosis
- Analyze user-reported symptoms using advanced AI models
- Provide detailed primary diagnosis with ICD codes
- Offer differential diagnoses with likelihood assessments
- Generate evidence-based reasoning with medical citations

### 🔄 Multi-Agent Chain Diagnosis System
- Sequential analysis through specialized AI roles:
  - Medical Analyst (for medical reports/images)
  - General Physician
  - Specialist Doctor
  - Pathologist
  - Nutritionist
  - Pharmacist
  - Follow-up Specialist
  - Radiance AI (Summarizer)
- Each role provides specialized insights for comprehensive care

### 👤 User Profiles & Health Data
- Secure user authentication and profile management
- Store personal health information and medical history
- Track health metrics and preferences
- Limit system for editing personal details (one-time edits for critical fields)

### 📊 Diagnosis History
- Save and track all previous diagnoses
- Review past health assessments
- Monitor health changes over time

### 🌐 Multilingual Support
- Access the platform in multiple languages
- Google Translate integration for global accessibility

### 📱 Responsive Design
- Professional dark-themed interface
- Fully responsive across all devices
- Smooth animations and transitions

## Technology Stack

### Frontend
- **Next.js**: React framework for server-side rendering and static site generation
- **TypeScript**: Type-safe JavaScript for robust code
- **TailwindCSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library for consistent UI elements

### Backend & Data
- **Supabase**: Backend-as-a-Service for authentication and database
  - Authentication system
  - PostgreSQL database
  - Storage for medical files and images
- **Perplexity Sonar API**: Advanced AI models for medical analysis
  - sonar-deep-research: For comprehensive medical analysis
  - sonar-pro: For specialized medical roles
  - sonar-reasoning-pro: For specialist doctor analysis

## Core Functionality

### Diagnosis System

The core of Radiance AI is its diagnosis system, which:

1. Collects user symptoms, age, gender, duration, and medical history
2. Sends this data to the Perplexity Sonar API with specialized medical prompts
3. Processes the AI response to extract:
   - Primary diagnosis with description and ICD code
   - Differential diagnoses with likelihood
   - Medical reasoning and evidence
   - Treatment recommendations
   - Test recommendations
   - Lifestyle advice
4. Presents this information in a user-friendly format
5. Saves the diagnosis to the user's history

### Chain Diagnosis System

The enhanced chain diagnosis system provides a comprehensive health assessment through multiple specialized AI roles:

1. **Medical Analyst**: Analyzes uploaded medical reports and images
2. **General Physician**: Provides initial diagnosis based on symptoms and medical analyst data
3. **Specialist Doctor**: Offers specialized insights based on the general physician's recommendation
4. **Pathologist**: Analyzes test results and provides pathological insights
5. **Nutritionist**: Recommends dietary changes based on the diagnosis
6. **Pharmacist**: Suggests medications and potential interactions
7. **Follow-up Specialist**: Recommends follow-up actions and monitoring
8. **Radiance AI (Summarizer)**: Combines all insights into a comprehensive care plan

Each role uses a specific Perplexity Sonar model optimized for its function, with structured JSON outputs for consistent data handling.

## Disclaimer

Radiance AI is designed as a preliminary health assessment tool and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.

---

© 2025 Radiance AI. All rights reserved.