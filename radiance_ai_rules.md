# 🧠 Radiance AI — Development Rules & Guidelines

This document outlines the comprehensive set of rules and guidelines to follow during the development of Radiance AI. These rules ensure consistency, quality, and efficient collaboration across the project.

---

## 🔄 Development Workflow

### Code Quality & Testing
- Implement detailed error handling in every function
- Test all changes in the browser and with curl commands for API endpoints
- Write unit tests for critical functionality
- Follow TypeScript best practices with proper type definitions
- Use ESLint and Prettier for code formatting

### Version Control
- Create feature branches for each task
- Use descriptive commit messages with task references
- Request code reviews before merging to main
- Keep commits focused on single logical changes

### Task Management
- Before starting any phase, update, or bug fix, mark it as in progress by replacing emoji with 🟡
- Follow priority order: 🟡 In Progress → 🐛 Bug → ⚠️ New Update → ⬜ Not Started → 🛑 Not Working
- Move completed bugs to the respective phase with proper defining
- Move completed updates or modifications to the respective phase with proper defining
- Sync changes of progress file to build plan file after every phase
- Before making any changes in file, add what you are currently working on in the progress section

---

## 🎨 Design & UI Guidelines

### Visual Consistency
- When creating any new page or component, use the design of the landing, dashboard, or profile page as a reference
- Follow the established color palette:
  - Background: `#0E0E10`
  - Surface/Card: `#1C1C20`
  - Primary: `#00C6D7`
  - Accent: `#1DE9B6`
  - Text: `#E0E0E0`
  - Muted Text: `#9E9E9E`
  - Border: `rgba(255, 255, 255, 0.1)`
- Maintain consistent spacing, typography, and component styling
- Use animations and transitions consistently across the application

### Responsive Design
- Ensure all components work on mobile, tablet, and desktop
- Use Tailwind's responsive classes for adaptive layouts
- Test all features on multiple screen sizes

### Accessibility
- Follow WCAG accessibility standards
- Ensure proper contrast ratios for text
- Add appropriate ARIA labels for interactive elements
- Support keyboard navigation

---

## 🧩 Component Guidelines

### Component Structure
- Create reusable components for common UI patterns
- Use proper component composition with children props
- Implement proper prop validation with TypeScript
- Follow the shadcn/ui component patterns

### State Management
- Use React hooks for local state management
- Implement context providers for shared state
- Keep state as close to where it's used as possible
- Use Supabase for persistent data storage

---

## 🔌 API Integration

### Perplexity Sonar API
- Use appropriate models for each AI role:
  - Medical Analyst: sonar-deep-research
  - General Physician: sonar-pro
  - Specialist Doctor: sonar-reasoning-pro
  - Pathologist, Nutritionist, Pharmacist, Follow-up Specialist, Summarizer: sonar-pro
- Implement proper error handling for API failures
- Add fallback mechanisms for when API is unavailable
- Use streaming responses for real-time UI updates

### Supabase Integration
- Follow Supabase best practices for data modeling
- Implement Row Level Security (RLS) policies
- Use server-side Supabase client for sensitive operations
- Keep API keys and secrets secure

---

## 📱 Feature Implementation

### Authentication & User Management
- Implement secure authentication flows
- Store only necessary user information
- Allow users to manage their profile data
- Implement proper session management

### Multilingual Support
- Ensure all text is translatable
- Test translations in multiple languages
- Support right-to-left languages where possible

### Chain Diagnosis System
- Follow the defined flow for the 8 specialized AI roles
- Use system prompts from `refined_role_prompt.md` for each AI role
- Implement proper data passing between roles
- Create a consistent UI for displaying results
- Store all AI responses for future reference

---

## 🤝 Collaboration Guidelines

### Agent Roles
- Use `augment.json` as the role file for defining agent roles and responsibilities
- Each agent should focus on their specialized area:
  - `frontend-dev`: UI components and pages
  - `backend-dev`: API integration, DB logic
  - `docs-agent`: README, setup guides
  - `test-agent`: Unit tests, accessibility
  - `designer`: Theming, layout, UX polish
  - `ai-specialist`: Chain diagnosis system implementation

### Communication
- Document complex implementations
- Use clear and descriptive variable and function names
- Add comments for non-obvious code
- Let each agent complete one subtask at a time using `augment ask`
- Use `augment review` often to catch and approve changes collaboratively

---

## 🚀 Deployment Guidelines

### Environment Configuration
- Use environment variables for all configuration
- Keep sensitive information out of the codebase
- Document required environment variables

### Performance Optimization
- Optimize images and assets
- Implement code splitting
- Use proper caching strategies
- Monitor and optimize API calls

### Security
- Implement proper authentication and authorization
- Validate all user inputs
- Protect against common web vulnerabilities
- Follow security best practices for Next.js and Supabase

---

Remember that these rules are designed to ensure a high-quality, consistent, and maintainable codebase. Following them will lead to a better product and more efficient collaboration.
