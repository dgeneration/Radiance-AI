## What it does

Radiance AI is an advanced AI-powered health diagnosis platform that leverages cutting-edge artificial intelligence to provide users with preliminary health assessments. The application uses the Perplexity Sonar API to analyze user-reported symptoms and medical data, offering detailed diagnostic insights, treatment recommendations, and medical guidance.

Our innovative Chain Diagnosis System provides a comprehensive health assessment through multiple specialized AI roles, each powered by specific Perplexity Sonar models:

- **Medical Analyst** (sonar-deep-research): Analyzes medical reports and images
- **General Physician** (sonar-pro): Provides initial assessment and diagnosis
- **Specialist Doctor** (sonar-reasoning-pro): Offers specialized medical insights
- **Pathologist, Nutritionist, Pharmacist** (sonar-pro): Provide domain-specific recommendations
- **Follow-up Specialist** (sonar-pro): Creates personalized follow-up plans
- **Radiance AI Summarizer** (sonar-pro): Compiles all insights into a comprehensive report

## How we built it

We built Radiance AI using a modern tech stack centered around the powerful Perplexity Sonar API:

1. **Frontend**: Next.js 15.3.1 with React 19, TypeScript, and TailwindCSS for a responsive and accessible UI
2. **Backend**: Serverless architecture with Next.js API routes and Supabase for authentication and database
3. **AI Integration**: Perplexity Sonar API with specialized models for different medical roles:
   - Implemented a reusable API component with standardized payload structure
   - Created specialized system prompts for each AI role in the diagnosis chain
   - Integrated image analysis capabilities for medical reports and scans
4. **Data Storage**: Supabase PostgreSQL for user profiles, medical history, and diagnosis results
5. **PWA Support**: Progressive Web App capabilities for cross-platform accessibility

The core of our application is the Chain Diagnosis System, which orchestrates a sequence of specialized AI roles to provide comprehensive health insights. Each role uses a specific Perplexity Sonar model optimized for its function, with structured JSON outputs for consistent data handling.

## Challenges we ran into

1. **AI Model Selection**: Finding the right Perplexity Sonar models for each specialized medical role required extensive testing and prompt engineering
2. **Medical Image Analysis**: Integrating image analysis capabilities with the Perplexity API required custom formatting and handling
3. **Streaming Responses**: Implementing real-time streaming responses from the Perplexity API while maintaining UI responsiveness
4. **JSON Structure Consistency**: Ensuring consistent JSON structure from different AI models for reliable data processing
5. **Mobile Responsiveness**: Creating an intuitive flow visualization for the Chain Diagnosis progress indicator on mobile devices
6. **Authentication Integration**: Seamlessly integrating Supabase authentication with Next.js while maintaining session persistence

## Accomplishments that we're proud of

1. **Multi-Agent Chain Diagnosis**: Successfully implementing a chain of specialized AI roles using different Perplexity Sonar models for comprehensive health analysis
2. **Medical Image Analysis**: Enabling the analysis of medical reports and images through the Perplexity API
3. **Structured JSON Responses**: Creating a reliable system for structured data extraction from AI responses
4. **Intuitive Progress Visualization**: Developing an engaging visual representation of the diagnosis process with cosmic-themed animations
5. **Comprehensive Health Reports**: Generating detailed health insight reports with actionable recommendations
6. **Responsive Design**: Creating a fully responsive application that works seamlessly across devices

## What we learned

1. **Perplexity Sonar API Capabilities**: We gained deep insights into the capabilities of different Perplexity Sonar models and how to optimize prompts for medical analysis
2. **Prompt Engineering**: We learned advanced techniques for crafting effective system prompts that guide AI models to produce structured, reliable outputs
3. **AI Chain Architecture**: We developed expertise in designing and implementing multi-agent AI systems where each agent has specialized knowledge and responsibilities
4. **Image Analysis Integration**: We discovered effective methods for integrating image analysis capabilities with text-based AI models
5. **Real-time Streaming**: We mastered techniques for handling streaming API responses while maintaining UI responsiveness

## What's next for Radiance AI

1. **Enhanced Medical Image Analysis**: Further improving the system's ability to analyze complex medical images and reports
2. **Expanded Specialist Roles**: Adding more specialized medical roles to the Chain Diagnosis System
3. **Multilingual Support**: Extending the platform to support multiple languages for global accessibility
4. **Telehealth Integration**: Connecting users with healthcare professionals for follow-up consultations
5. **Mobile Applications**: Developing native mobile applications for iOS and Android
6. **Advanced Data Analytics**: Implementing anonymized data analysis to improve diagnostic accuracy over time
7. **Voice Interface**: Adding voice input capabilities for symptom reporting

## How Perplexity API was used in our project

Perplexity Sonar API is the core intelligence powering Radiance AI's diagnostic capabilities. We implemented a sophisticated integration that leverages different Sonar models for specialized medical roles:

1. **Model Selection Strategy**: We carefully matched each medical role with the most appropriate Sonar model:
   - **sonar-deep-research**: Used for the Medical Analyst role to provide comprehensive analysis of medical reports and images with deep research capabilities
   - **sonar-reasoning-pro**: Employed for the Specialist Doctor role where advanced reasoning and specialized medical knowledge are critical
   - **sonar-pro**: Utilized for General Physician, Pathologist, Nutritionist, Pharmacist, and Follow-up Specialist roles where balanced performance and specialized knowledge are needed

2. **Custom API Integration**:
   - Developed a reusable API component with standardized payload structure
   - Implemented server-side API routes to securely handle Perplexity API calls without exposing API keys
   - Created specialized system prompts for each role to guide the models toward producing structured JSON outputs

3. **Image Analysis Implementation**:
   - Integrated image analysis capabilities by formatting requests with both text and image_url objects
   - Implemented custom handling for medical reports and scans uploaded by users
   - Created a pipeline for processing and analyzing medical images through the Perplexity API

4. **Streaming Response Handling**:
   - Implemented real-time streaming responses for interactive user experience
   - Created a custom streaming handler to process chunks of data as they arrive
   - Developed UI components that update in real-time as responses are generated

## Biggest frustrations with Sonar APIs

While Perplexity Sonar API has been instrumental in building Radiance AI, we encountered several challenges:

1. **JSON Structure Consistency**: Different models sometimes produce slightly different JSON structures, requiring additional validation and error handling to ensure consistent data processing.

2. **Image Analysis Limitations**: The current image analysis capabilities, while powerful, could benefit from more specialized medical image understanding and standardized output formats for medical imagery.

3. **Token Limitations**: For complex medical analyses, we occasionally hit token limitations, requiring us to optimize prompts and split complex analyses across multiple roles.

4. **Documentation Gaps**: More comprehensive documentation specifically for medical use cases and structured output generation would have accelerated our development process.


## Development Timeline and Acceleration

From concept to working prototype, Radiance AI took approximately 4 weeks to develop. The breakdown of our development timeline:

- **Week 1**: Research, planning, and architecture design
- **Week 1-2**: Core API integration and basic UI implementation
- **Week 2-3**: Chain Diagnosis System development and testing
- **Week 3-4**: UI refinement, testing, and deployment

Perplexity could help accelerate this process by:

1. **Medical-Specific Model Variants**: Pre-trained models specifically optimized for medical diagnosis and healthcare applications
2. **Structured Output Templates**: Built-in support for generating consistent JSON structures for common medical use cases
3. **Enhanced Documentation**: More comprehensive examples and best practices for healthcare applications
4. **Medical Image Analysis Enhancements**: Specialized capabilities for analyzing medical imagery with standardized output formats
5. **SDK and Framework Integration**: Official SDKs for popular frameworks like Next.js to streamline integration


## Built with
* Next.js
* React
* TypeScript
* TailwindCSS
* Supabase
* Perplexity Sonar API
* PostgreSQL
* shadcn/ui
* Progressive Web App (PWA)
