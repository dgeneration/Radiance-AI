
# 🧠 Radiance AI — Multi-Agent Build Plan for Augment

This document provides a **phase-by-phase breakdown** of the entire development of Radiance AI using Augment multi-agent workflows. Each phase is divided into small, logic-based tasks so agents can act independently without confusion.

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
  - Surface: `#1C1C20`
  - Accent: `#00C6D7`, `#1DE9B6`
  - Text: `#E0E0E0`, Muted: `#9E9E9E`

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

## 🧪 Phase 5: Testing & QA

### 🔹 5.1 Unit Tests
- Write tests for:
  - API functions
  - Form validation
  - Components (e.g. result card)

### 🔹 5.2 Accessibility & Mobile
- Ensure WCAG accessibility standards
- Make UI fully mobile responsive

---

## 📄 Phase 6: Final Touches

### 🔹 6.1 SEO & Meta
- ✅ Add favicon using RadianceAi_Logo.svg
- ✅ Create Privacy Policy page with design matching landing page
- ✅ Create Terms of Service page with design matching landing page
- ✅ Create Medical Disclaimer page with design matching landing page
- Add meta tags and OpenGraph
- Create social preview banner

### 🔹 6.2 README & Docs
- Finalize `README.md`
- Add usage instructions, install steps, credits

### 🔹 6.3 Deployment
- Deploy to Vercel
- Add environment variables for API and Supabase keys

---

## ✅ Agent Guide Summary

Each Augment Agent can focus on:
- `frontend-dev`: UI components and pages
- `backend-dev`: API integration, DB logic
- `docs-agent`: README, setup guides
- `test-agent`: Unit tests, accessibility
- `designer`: Theming, layout, UX polish

---

## Notes
- Last updated: May 11, 2024
- Current focus: Phase 4.2 - Geo-based Help
- Removed temporary project files and updated package name

---

Let each agent complete one subtask at a time using `augment ask`. Use `augment review` often to catch and approve changes collaboratively.
