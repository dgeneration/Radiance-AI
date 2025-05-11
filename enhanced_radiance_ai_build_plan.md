# 🧠 Radiance AI — Enhanced Multi-Agent Build Plan

This document provides a **comprehensive phase-by-phase breakdown** of the entire development of Radiance AI using Augment multi-agent workflows. Each phase is divided into small, logic-based tasks so agents can act independently without confusion.

---

## 🚀 Phase 1: Project Setup

### ✅ 1.1 Initialize Project
- Create a Next.js project with TypeScript
- Install TailwindCSS and configure it
- Add shadcn/ui component library
- Set up project structure: `/components`, `/lib`, `/styles`

### ✅ 1.2 Theme Configuration
- Apply dark theme using Tailwind
- Use color palette:
  - Background: `#0E0E10`
  - Surface/Card: `#1C1C20`
  - Primary: `#00C6D7`
  - Accent: `#1DE9B6`
  - Text: `#E0E0E0`
  - Muted Text: `#9E9E9E`
  - Border: `rgba(255, 255, 255, 0.1)`

### ✅ 1.3 Augment
- Add `augment.json` with agent definitions

### ✅ 1.4 UI Components
- Create reusable Header and Footer components
- Implement global layout with consistent navigation
- Standardize button styles across pages
- Add RadianceAi_Logo.svg before the text 'Radiance AI' in Header and Footer components

---

## ⚙️ Phase 2: Core Functionality

### ✅ 2.1 Symptom Input UI
- Design a form: symptoms, age, gender, duration
- Add text, dropdowns, and form controls
- Include form validation and error handling
- Enhance duration field with dropdown menus for number and time unit
- Integrate with user profile data

### ✅ 2.2 Sonar API Integration
- Write function to send user input to Perplexity Sonar API
- Parse the response into:
  - Diagnosis
  - Reasoning
  - Citations
  - ICD codes
- Switch from demo mode to real Perplexity Sonar API
- Add support for extracting differential diagnoses, medication plans, and test recommendations

### ✅ 2.3 Display Results
- Create result page or modal:
  - Show diagnosis with description
  - Display explanation and citations
  - Show ICD code mappings
- Restrict diagnosis page access to logged-in users only

---

## 🔐 Phase 3: Auth & Data

### ✅ 3.1 Supabase Auth
- Add user authentication (email or OAuth)
- Redirect to dashboard after login
- Enhanced user registration with detailed profile information
- Store user profile data in Supabase `user_profiles` table
- Create dedicated profile page with health information
- Add edit functionality for personal information
- Allow unlimited edits for health information
- Enhance profile page UI

### ✅ 3.2 Save Sessions
- Create a table in Supabase: `diagnoses`
- Store:
  - User ID
  - Symptoms entered
  - Results returned
  - Timestamp

### ✅ 3.3 History Page
- List past sessions
- Allow viewing diagnosis again

---

## 🌍 Phase 4: Enhancements

### ✅ 4.1 Multilingual Support
- Integrate Google Translate
- Translate All text of the site
- Add language selection dropdown with flags

### 🔹 4.2 Geo-based Help
- Detect user's country/location
- Suggest nearest hospitals (use static dataset)

### 🔹 4.3 Role-Based View
- Switch between Patient View and Doctor View
- Doctor View includes more clinical info (e.g., ICD, citations, detail)

---

## 🤖 Phase 5: Multi-Agent Chain Diagnosis System

### 🔹 5.1 System Architecture
- Design the chain diagnosis flow with 8 specialized AI roles
- Create standardized API payload structure for all roles
- Implement streaming API support for real-time UI updates
- Set up file management system for medical reports/images
- Use system prompts from `refined_role_prompt.md` for each AI role

### 🔹 5.2 Medical Analyst AI
- Configure API component using sonar-deep-research model
- Implement conditional logic based on medical report presence
- Create UI for displaying streaming Medical Analyst results
- Add storage and retrieval of Medical Analyst responses

### 🔹 5.3 General Physician AI
- Configure API component using sonar-pro model
- Implement logic to incorporate Medical Analyst data
- Create UI for displaying streaming General Physician results
- Add extraction of recommended specialist type

### 🔹 5.4 Specialist Doctor AI
- Configure API component using sonar-reasoning-pro model
- Implement dynamic system prompt based on specialist type
- Create UI for displaying streaming Specialist Doctor results
- Add specialized display components based on specialist type

### 🔹 5.5 Additional AI Roles
- Implement Pathologist AI using sonar-pro model
- Implement Nutritionist AI using sonar-pro model
- Implement Pharmacist AI using sonar-pro model
- Implement Follow-up Specialist AI using sonar-pro model
- Implement Radiance AI Summarizer using sonar-pro model

### 🔹 5.6 Chain Diagnosis UI
- Create progressive diagnosis journey interface
- Implement role-based sections with collapsible details
- Add visual indicators for active/completed roles
- Design comprehensive final report view

---

## 🧪 Phase 6: Testing & QA

### 🔹 6.1 Unit Tests
- Write tests for:
  - API functions
  - Form validation
  - Components (e.g. result card)
  - Chain diagnosis system

### 🔹 6.2 Accessibility & Mobile
- Ensure WCAG accessibility standards
- Make UI fully mobile responsive
- Test chain diagnosis system on mobile devices

---

## 📄 Phase 7: Final Touches

### 🔹 7.1 SEO & Meta
- ✅ Add favicon using RadianceAi_Logo.svg
- ✅ Create Privacy Policy page with design matching landing page
- ✅ Create Terms of Service page with design matching landing page
- ✅ Create Medical Disclaimer page with design matching landing page
- ✅ Create 404 and other error pages matching the design of other pages
- Add meta tags and OpenGraph
- Create social preview banner

### 🔹 7.2 README & Docs
- Finalize `README.md`
- Add usage instructions, install steps, credits
- Document the chain diagnosis system architecture

### 🔹 7.3 Deployment
- Deploy to Vercel
- Add environment variables for API and Supabase keys
- Configure production settings

---

## ✅ Agent Guide Summary

Each Augment Agent can focus on:
- `frontend-dev`: UI components and pages
- `backend-dev`: API integration, DB logic
- `docs-agent`: README, setup guides
- `test-agent`: Unit tests, accessibility
- `designer`: Theming, layout, UX polish
- `ai-specialist`: Chain diagnosis system implementation

---

## Notes
- Last updated: May 12, 2024
- Current focus: Phase 4.2 - Geo-based Help and Phase 5.1 - Chain Diagnosis System Architecture
- When creating any new page or component, use the design of the landing, dashboard, or profile page as a reference for consistent styling
- Use `augment.json` as the role file for defining agent roles and responsibilities
- Use `refined_role_prompt.md` as the reference for system prompts in the Chain Diagnosis System

---

Let each agent complete one subtask at a time using `augment ask`. Use `augment review` often to catch and approve changes collaboratively.
