# 🧠 Radiance AI — Build Progress Tracker

This document tracks the progress of tasks outlined in the Radiance AI build plan.

## Progress Legend
- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- 🐛 Bug
- ⚠️ New Update
- 🛑 Not Working

---

## Rules to Follow

- While checking for changes are working by opening the application in browser also check it using the curl command every time
- Detailed Error Handeling in every functions
- Move the completed bugs to the respective phase with proper defining
- Move the completed updates or modification to the respective phase with proper defining
- Before Staring any Phase ,update or bugs mark it as in progress by replaceing emoji with 🟡
- Sync changes of progress file to build plan file after every phase
- Before making any changes in file add what you are currently working on in the progress section so if any error occured while generating code you can catchup from there, after that remove it
- First Follow 🟡 In Progress
- Second Follow 🐛 Bug
- Third Follow ⚠️ New Update
- Fourth Follow ⬜ Not Started
- Last Follow 🛑 Not Working

---

## In Progress

- No pending tasks

---

## Bugs

- No pending bugs

---
## New Updates or Modification

- No pending updates

---

## 🚀 Phase 1: Project Setup

### ✅ 1.1 Initialize Project
- ✅ Create a Next.js project with TypeScript
- ✅ Install TailwindCSS and configure it
- ✅ Add shadcn/ui component library
- ✅ Set up project structure: `/components`, `/lib`, `/styles`

### ✅ 1.2 Theme Configuration
- ✅ Apply dark theme using Tailwind
- ✅ Use color palette:
  - Background: `#0E0E10`
  - Surface/Card: `#1C1C20`
  - Primary: `#00C6D7`
  - Accent: `#1DE9B6`
  - Text: `#E0E0E0`
  - Muted Text: `#9E9E9E`
  - Border: `rgba(255, 255, 255, 0.1)`

### ✅ 1.3 Augment
- ✅ Add `augment.json` with agent definitions

### ✅ 1.4 UI Components
- ✅ Create reusable Header and Footer components
- ✅ Implement global layout with consistent navigation
- ✅ Standardize button styles across pages
- ✅ Add RadianceAi_Logo.svg before the text 'Radiance AI' in Header and Footer components

---

## ⚙️ Phase 2: Core Functionality

### ✅ 2.1 Symptom Input UI
- ✅ Design a form: symptoms, age, gender, duration
- ✅ Add text, dropdowns, and form controls
- ✅ Include form validation and error handling
- ✅ Enhance duration field with dropdown menus for number and time unit
- ✅ Integrate with user profile data


### ✅ 2.2 Sonar API Integration
- ✅ Write function to send user input to Perplexity Sonar API
- ✅ Parse the response into:
  - ✅ Diagnosis
  - ✅ Reasoning
  - ✅ Citations
  - ✅ ICD codes
- ✅ Switch from demo mode to real Perplexity Sonar API
- ✅ Add support for extracting differential diagnoses, medication plans, and test recommendations

### ✅ 2.3 Display Results
- ✅ Create result page or modal:
  - ✅ Show diagnosis with description
  - ✅ Display explanation and citations
  - ✅ Show ICD code mappings
- ✅ Restrict diagnosis page access to logged-in users only

---

## 🔐 Phase 3: Auth & Data

### ✅ 3.1 Supabase Auth
- ✅ Add user authentication (email or OAuth)
- ✅ Redirect to dashboard after login
- ✅ Enhanced user registration with detailed profile information
- ✅ Store user profile data in Supabase `user_profiles` table
- ✅ Create dedicated profile page with health information
- ✅ Add edit functionality for personal information
- ✅ Allow unlimited edits for health information
- ✅ Enhance profile page UI

### ✅ 3.2 Save Sessions
- ✅ Create a table in Supabase: `diagnoses`
- ✅ Store:
  - ✅ User ID
  - ✅ Symptoms entered
  - ✅ Results returned
  - ✅ Timestamp

### ✅ 3.3 History Page
- ✅ List past sessions
- ✅ Allow viewing diagnosis again

---

## 🌍 Phase 4: Enhancements

### ✅ 4.1 Multilingual Support
- ✅ Integrate Google Translate
- ✅ Translate All text of the site
- ✅ Add language selection dropdown with flags

### 🔹 4.2 Geo-based Help
- ⬜ Detect user's country/location
- ⬜ Suggest nearest hospitals (use static dataset)

### 🔹 4.3 Role-Based View
- ⬜ Switch between Patient View and Doctor View
- ⬜ Doctor View includes more clinical info (e.g., ICD, citations, detail)

---

## 🧪 Phase 5: Testing & QA

### 🔹 5.1 Unit Tests
- ⬜ Write tests for:
  - API functions
  - Form validation
  - Components (e.g. result card)

### 🔹 5.2 Accessibility & Mobile
- ⬜ Ensure WCAG accessibility standards
- ⬜ Make UI fully mobile responsive

---

## 📄 Phase 6: Final Touches

### 🔹 6.1 SEO & Meta
- ✅ Add favicon using RadianceAi_Logo.svg
- ✅ Create Privacy Policy page with design matching landing page
- ✅ Create Terms of Service page with design matching landing page
- ✅ Create Medical Disclaimer page with design matching landing page
- ✅ Create 404 and other error pages matching the design of other pages
- ⬜ Add meta tags and OpenGraph
- ⬜ Create social preview banner

### 🔹 6.2 README & Docs
- ⬜ Finalize `README.md`
- ⬜ Add usage instructions, install steps, credits

### 🔹 6.3 Deployment
- ⬜ Deploy to Vercel
- ⬜ Add environment variables for API and Supabase keys

---

## Notes
- Last updated: May 11, 2024
