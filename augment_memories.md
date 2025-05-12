# 🧠 Radiance AI — Augment Memories

This document contains all the important memories stored by the Augment Agent for the Radiance AI project. These memories guide the agent's behavior and ensure consistency across interactions.

---

## 🎨 Style and Design

- When creating any new page or component, use the design of the landing, dashboard, or profile page as a reference for consistent styling. Follow the established color palette: Background: #0E0E10, Surface/Card: #1C1C20, Primary: #00C6D7, Accent: #1DE9B6, Text: #E0E0E0, Muted Text: #9E9E9E, Border: rgba(255, 255, 255, 0.1).

## 🤖 Agent Configuration

- Use augment.json as the role file for defining agent roles and responsibilities. Each agent should focus on their specialized area: frontend-dev (UI components and pages), backend-dev (API integration, DB logic), docs-agent (README, setup guides), test-agent (Unit tests, accessibility), designer (Theming, layout, UX polish), ai-specialist (Chain diagnosis system implementation).

## 🧠 AI Model Selection

- For the Multi-Agent Chain Diagnosis System, use appropriate Perplexity Sonar models for each AI role: Medical Analyst (sonar-deep-research), General Physician (sonar-pro), Specialist Doctor (sonar-reasoning-pro), and Pathologist, Nutritionist, Pharmacist, Follow-up Specialist, Summarizer (all using sonar-pro).

## 📝 Chain Diagnosis System Prompts

- Use refined_role_prompt.md as the reference for system prompts in the Chain Diagnosis System. This file contains the detailed system prompts for each AI role in the multi-agent chain.

## 🔌 Supabase Integration

- Supabase is connected to Augment. Execute all Supabase operations through Augment and treat this as a high priority. Do not attempt to interact with Supabase directly.

## 🛠️ Project Setup & Development

- The project is a Next.js 15.3.1 application using Turbopack for faster development.
- Start the development server with `npm run dev` which runs on http://localhost:3000.
- The project uses Tailwind CSS for styling and various Radix UI components for the UI.
- React 19 is used as the frontend framework with TypeScript for type safety.

---

## 📋 Memory Update Log

- Last updated: May 15, 2024 (added Project Setup & Development section)
- This file should be updated whenever new memories are added to the Augment Agent.

---

*Note: This file serves as a reference for all the important information stored in the Augment Agent's memory. Share this file with other team members to ensure consistent behavior across different instances of the Augment Agent.*
