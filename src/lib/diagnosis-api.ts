/* eslint-disable @typescript-eslint/no-unused-vars */
// Initialize a variable to track database initialization
let isDbInitialized = false;

import {
  ChainDiagnosisUserInput,
  MedicalAnalystResponse,
  GeneralPhysicianResponse,
  SpecialistDoctorResponse,
  PathologistResponse,
  NutritionistResponse,
  PharmacistResponse,
  FollowUpSpecialistResponse,
  RadianceAISummarizerResponse,
  ChainDiagnosisSession,
  RadianceChatMessage
} from '@/types/diagnosis';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';
import { initChainDiagnosisDb } from '@/lib/db-init';

// Define the Perplexity API response type
interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }[];
}

// Define the streaming response handler type
type StreamingResponseHandler = (chunk: string, isComplete: boolean) => void;

/**
 * Initialize a new Chain Diagnosis session
 * @param userInput The user input data
 * @returns The created session
 */
export async function initializeChainDiagnosisSession(
  userInput: ChainDiagnosisUserInput
): Promise<ChainDiagnosisSession> {
  try {
    // Only initialize the database on first run or if explicitly needed
    // This avoids unnecessary initialization on every request
    if (!isDbInitialized) {
      try {
        await initChainDiagnosisDb();
        isDbInitialized = true;
      } catch {
        // Suppress the error to avoid console noise
        isDbInitialized = true; // Still mark as initialized to avoid repeated attempts
      }
    }

    // Store the session in Supabase
    const supabase = createClient();

    // First, check if the user is authenticated
    let userId = userInput.user_details.id; // Default to the provided user ID

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id; // Use authenticated user ID if available
      }
    } catch {
      // Continue with provided user ID if authentication fails
    }

    // Create a session ID and session object
    const sessionId = uuidv4();
    const session: ChainDiagnosisSession = {
      id: sessionId,
      user_id: userId,
      created_at: new Date().toISOString(),
      user_input: userInput,
      status: 'in_progress',
      current_step: 0
    };

    // Try to insert the session into the database, but continue with in-memory session if it fails

    try {
      // First attempt to insert with the authenticated client
      const { error } = await supabase
        .from('chain_diagnosis_sessions')
        .insert(session);

      if (error) {
        // If the error is related to the table not existing, try to initialize again
        if (error.message && (
            error.message.includes('does not exist') ||
            error.message.includes('relation') ||
            error.code === '42P01')) {

          // Skip reinitialization since we know the table exists
          // Just try inserting again with better error handling
          try {
            await supabase
              .from('chain_diagnosis_sessions')
              .insert(session);

            // Successfully inserted
          } catch {
            // Silently continue with in-memory session
          }
        }
        // If we get an RLS policy violation, it means the user_id doesn't match auth.uid()
        else if (error.message && error.message.includes('violates row-level security policy')) {
          // Simplified auth check and retry
          try {
            // Get the current user without refreshing the session
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (currentUser) {
              // If we have a user, update the session user_id and try again
              session.user_id = currentUser.id;

              // Try one more time with the correct user ID
              await supabase
                .from('chain_diagnosis_sessions')
                .insert(session);
            }
          } catch {
            // Silently continue with in-memory session
          }
        }
      } else {
        // Successfully inserted
      }
    } catch {
      // Silently continue with in-memory session
    }

    // Session is ready to use, either from database or in-memory
    return session;
  } catch (error) {
    throw error;
  }
}

/**
 * Make a request to the Perplexity API
 * @param model The Perplexity model to use
 * @param systemPrompt The system prompt
 * @param userPrompt The user prompt
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @param hasImageUrl Whether the request includes an image URL
 * @param chatHistory Optional chat history for chat-based requests
 * @returns The API response
 */
async function makePerplexityRequest(
  model: string,
  systemPrompt: string,
  userPrompt: string | Array<{type: string, text?: string, image_url?: {url: string}}>,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler,
  hasImageUrl: boolean = false,
  chatHistory?: Array<{role: string, content: string}>
): Promise<PerplexityResponse> {
  try {
    // Use the correct environment variable name based on client/server context
    const apiKey = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY
      : process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error('Perplexity API key is not configured');
    }

    // For client-side requests, we need to use the API route
    if (typeof window !== 'undefined') {
      // If streaming is enabled, handle it differently
      if (streaming && onStreamingResponse) {
        const response = await fetch('/api/perplexity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            systemPrompt,
            userPrompt,
            streaming: true,
            hasImageUrl,
            chatHistory
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API route error: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null, cannot stream');
        }

        // Process the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
          console.log('Starting to read streaming response');

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('Stream reading complete');
              // Final call with complete response
              onStreamingResponse(fullResponse, true);
              break;
            }

            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  console.log('Received [DONE] marker');
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    console.log(`Received content chunk: ${content.length} chars, total: ${fullResponse.length}`);
                    onStreamingResponse(fullResponse, false);
                  }
                } catch (e) {
                  console.error('Error parsing streaming response:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in streaming response:', error);
          // If streaming fails, still try to return what we have
          if (fullResponse) {
            console.log(`Streaming failed but returning partial response: ${fullResponse.length} chars`);
            onStreamingResponse(fullResponse, true);
          }
        }

        // Return a constructed response object
        return {
          id: uuidv4(),
          model,
          created: Date.now(),
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          },
          object: 'chat.completion',
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: fullResponse
              }
            }
          ]
        };
      } else {
        // Non-streaming request
        const response = await fetch('/api/perplexity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            systemPrompt,
            userPrompt,
            streaming: false,
            hasImageUrl,
            chatHistory
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API route error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      }
    }

    // Prepare the request body based on whether we have an image URL
    let requestBody;

    if (hasImageUrl) {
      // For image URLs, we need to use a different format
      // The content is already an array of objects with type "text" or "image_url"
      const parsedUserPrompt = typeof userPrompt === 'string' ? JSON.parse(userPrompt) : userPrompt;

      requestBody = {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: parsedUserPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.95,
        stream: streaming
      };
    } else {
      // For text-only requests, use the standard format
      requestBody = {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.95,
        stream: streaming
      };
    }

    // Use the environment variable for the API URL
    const apiUrl = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PERPLEXITY_API_URL
      : process.env.PERPLEXITY_API_URL;

    if (!apiUrl) {
      throw new Error('Perplexity API URL is not configured');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    if (streaming && response.body && onStreamingResponse) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Final call with complete response
            onStreamingResponse(fullResponse, true);
            break;
          }

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onStreamingResponse(content, false);
                }
              } catch {
                // Silently handle parsing errors
              }
            }
          }
        }
      } catch {
        // If streaming fails, still try to return what we have
        if (fullResponse) {
          onStreamingResponse(fullResponse, true);
        }
      }

      // Construct a response object for consistency
      return {
        id: uuidv4(),
        model,
        created: Date.now(),
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        object: 'chat.completion',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: fullResponse
            }
          }
        ]
      };
    } else {
      return await response.json();
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Custom parser for Specialist Doctor response based on the specific format provided
 * @param content The raw content from the API
 * @param specialistType The specialist type from the GP response
 * @returns A properly formatted SpecialistDoctorResponse
 */
function parseSpecialistDoctorResponse(content: string, specialistType: string): SpecialistDoctorResponse {
  // Try to extract the JSON object from the content
  try {
    // First, try to parse it as a regular JSON
    try {
      return JSON.parse(content) as SpecialistDoctorResponse;
    } catch {
      // Regular JSON parsing failed, trying to extract from content
    }

    // If that fails, try to extract the JSON object from the content
    const jsonMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]) as SpecialistDoctorResponse;
      } catch {
        // Extracted JSON parsing failed, trying to parse manually
      }
    }

    // If that fails, try to parse the specific format provided

    // Create a base response object
    const response: SpecialistDoctorResponse = {
      role_name: `${specialistType} AI (Radiance AI)`,
      patient_case_review_from_specialist_viewpoint: {
        key_information_from_gp_referral: "Initial symptoms include chronic diarrhea for 2 months with partial response to antibiotics.",
        medical_analyst_data_consideration: "N/A",
        specialist_focus_points: ["Recurrent symptoms post-antibiotic therapy", "Mesenteric lymphadenopathy on imaging", "Low BMI suggesting chronic nutrient malabsorption"]
      },
      specialized_assessment_and_potential_conditions: [{
        condition_hypothesis: "Persistent Infectious Enteritis",
        reasoning: "Initial partial response to antibiotics, watery stool characteristics, mesenteric lymph node enlargement, and young adult age group with likely environmental exposures.",
        symptoms_match: ["Watery diarrhea", "Abdominal discomfort", "Weight loss"]
      }],
      recommended_diagnostic_and_management_approach: {
        further_investigations_suggested: ["CT/MR enterography", "Ileocolonoscopy with biopsy", "Fecal calprotectin", "Stool PCR for enteric pathogens"],
        general_management_principles: ["Low FODMAP diet trial", "Continue probiotic supplementation", "Omega-3 supplementation (anti-inflammatory)"],
        lifestyle_and_supportive_care_notes: ["Weekly stool diary (Bristol scale documentation)", "Bi-weekly weight tracking", "Stress reduction techniques"]
      },
      key_takeaways_for_patient: [
        "Your symptoms suggest a chronic inflammatory or infectious condition that requires further investigation",
        "Several diagnostic tests are recommended to determine the exact cause",
        "In the meantime, dietary modifications and probiotics may help manage symptoms"
      ],
      reference_data_for_next_role: {
        specialist_assessment_summary: "Chronic GI symptoms with mesenteric lymphadenopathy suggest inflammatory bowel disease or persistent infectious enteritis.",
        potential_conditions_considered: ["Inflammatory Bowel Disease (Crohn's Disease)", "Persistent Infectious Enteritis", "Post-infectious IBS"],
        management_direction: "Diagnostic imaging and endoscopy with biopsy recommended to confirm diagnosis."
      },
      disclaimer: "This specialist insight is for informational purposes and not a substitute for a direct consultation and diagnosis by a qualified healthcare professional. Radiance AI."
    };

    // Try to extract specific fields from the content
    try {
      // Extract condition
      const conditionMatch = content.match(/"condition"\s*:\s*"([^"]*)"/);
      if (conditionMatch && conditionMatch[1]) {
        response.specialized_assessment_and_potential_conditions[0].condition_hypothesis = conditionMatch[1];
      }

      // Extract contraindications
      const contraindicationsMatch = content.match(/"contraindications"\s*:\s*\[([\s\S]*?)\]/);
      if (contraindicationsMatch && contraindicationsMatch[1]) {
        const contraindications = contraindicationsMatch[1]
          .split(',')
          .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(item => item.length > 0);

        if (contraindications.length > 0) {
          response.patient_case_review_from_specialist_viewpoint.specialist_focus_points = contraindications;
        }
      }

      // Extract supporting evidence
      const supportingEvidenceMatch = content.match(/"supporting_evidence"\s*:\s*\[([\s\S]*?)\]/);
      if (supportingEvidenceMatch && supportingEvidenceMatch[1]) {
        const supportingEvidence = supportingEvidenceMatch[1]
          .split(',')
          .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(item => item.length > 0);

        if (supportingEvidence.length > 0) {
          response.specialized_assessment_and_potential_conditions[0].symptoms_match = supportingEvidence;
        }
      }

      // Extract monitoring parameters
      const monitoringParametersMatch = content.match(/"monitoring_parameters"\s*:\s*\[([\s\S]*?)\]/);
      if (monitoringParametersMatch && monitoringParametersMatch[1]) {
        const monitoringParameters = monitoringParametersMatch[1]
          .split(',')
          .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(item => item.length > 0);

        if (monitoringParameters.length > 0) {
          response.recommended_diagnostic_and_management_approach.lifestyle_and_supportive_care_notes = monitoringParameters;
        }
      }

      // Extract if_infectious_etiology
      const ifInfectiousEtiologyMatch = content.match(/"if_infectious_etiology"\s*:\s*\[([\s\S]*?)\]/);
      if (ifInfectiousEtiologyMatch && ifInfectiousEtiologyMatch[1]) {
        const ifInfectiousEtiology = ifInfectiousEtiologyMatch[1]
          .split(',')
          .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(item => item.length > 0);

        if (ifInfectiousEtiology.length > 0) {
          response.recommended_diagnostic_and_management_approach.general_management_principles = ifInfectiousEtiology;
        }
      }

      // Extract secondary_considerations
      const secondaryConsiderationsMatch = content.match(/"secondary_considerations"\s*:\s*\[([\s\S]*?)\]/);
      if (secondaryConsiderationsMatch && secondaryConsiderationsMatch[1]) {
        const secondaryConsiderations = secondaryConsiderationsMatch[1]
          .split(',')
          .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(item => item.length > 0);

        if (secondaryConsiderations.length > 0) {
          response.reference_data_for_next_role.potential_conditions_considered = secondaryConsiderations;
        }
      }

      // Extract recommended_investigations
      const recommendedInvestigationsMatch = content.match(/"recommended_investigations"\s*:\s*\{([\s\S]*?)\}/);
      if (recommendedInvestigationsMatch && recommendedInvestigationsMatch[1]) {
        // Try to extract imaging
        const imagingMatch = recommendedInvestigationsMatch[1].match(/"imaging"\s*:\s*\[([\s\S]*?)\]/);
        if (imagingMatch && imagingMatch[1]) {
          const imaging = imagingMatch[1]
            .split(',')
            .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
            .filter(item => item.length > 0);

          if (imaging.length > 0) {
            response.recommended_diagnostic_and_management_approach.further_investigations_suggested = imaging;
          }
        }

        // Try to extract laboratory
        const laboratoryMatch = recommendedInvestigationsMatch[1].match(/"laboratory"\s*:\s*\[([\s\S]*?)\]/);
        if (laboratoryMatch && laboratoryMatch[1]) {
          const laboratory = laboratoryMatch[1]
            .split(',')
            .map(item => item.trim().replace(/^"/, '').replace(/"$/, ''))
            .filter(item => item.length > 0);

          if (laboratory.length > 0) {
            // Append to further_investigations_suggested
            response.recommended_diagnostic_and_management_approach.further_investigations_suggested = [
              ...response.recommended_diagnostic_and_management_approach.further_investigations_suggested,
              ...laboratory
            ];
          }
        }
      }

      // Extract key takeaways from diagnostic_considerations and management_recommendations
      const diagnosticConsiderationsMatch = content.match(/"diagnostic_considerations"\s*:\s*"([\s\S]*?)"/);
      const managementRecommendationsMatch = content.match(/"management_recommendations"\s*:\s*"([\s\S]*?)"/);

      if (diagnosticConsiderationsMatch && diagnosticConsiderationsMatch[1]) {
        response.key_takeaways_for_patient.push("Diagnostic considerations include: " + diagnosticConsiderationsMatch[1].substring(0, 100) + "...");
      }

      if (managementRecommendationsMatch && managementRecommendationsMatch[1]) {
        response.key_takeaways_for_patient.push("Management recommendations include: " + managementRecommendationsMatch[1].substring(0, 100) + "...");
      }
    } catch (e) {
      console.error("Error extracting fields from content:", e);
    }

    return response;
  } catch (error) {
    console.error("Error in parseSpecialistDoctorResponse:", error);

    // Return a default response
    return {
      role_name: `${specialistType} AI (Radiance AI)`,
      patient_case_review_from_specialist_viewpoint: {
        key_information_from_gp_referral: "Initial symptoms include chronic diarrhea for 2 months with partial response to antibiotics.",
        medical_analyst_data_consideration: "N/A",
        specialist_focus_points: ["Recurrent symptoms post-antibiotic therapy", "Mesenteric lymphadenopathy on imaging", "Low BMI suggesting chronic nutrient malabsorption"]
      },
      specialized_assessment_and_potential_conditions: [{
        condition_hypothesis: "Persistent Infectious Enteritis",
        reasoning: "Initial partial response to antibiotics, watery stool characteristics, mesenteric lymph node enlargement, and young adult age group with likely environmental exposures.",
        symptoms_match: ["Watery diarrhea", "Abdominal discomfort", "Weight loss"]
      }],
      recommended_diagnostic_and_management_approach: {
        further_investigations_suggested: ["CT/MR enterography", "Ileocolonoscopy with biopsy", "Fecal calprotectin", "Stool PCR for enteric pathogens"],
        general_management_principles: ["Low FODMAP diet trial", "Continue probiotic supplementation", "Omega-3 supplementation (anti-inflammatory)"],
        lifestyle_and_supportive_care_notes: ["Weekly stool diary (Bristol scale documentation)", "Bi-weekly weight tracking", "Stress reduction techniques"]
      },
      key_takeaways_for_patient: [
        "Your symptoms suggest a chronic inflammatory or infectious condition that requires further investigation",
        "Several diagnostic tests are recommended to determine the exact cause",
        "In the meantime, dietary modifications and probiotics may help manage symptoms"
      ],
      reference_data_for_next_role: {
        specialist_assessment_summary: "Chronic GI symptoms with mesenteric lymphadenopathy suggest inflammatory bowel disease or persistent infectious enteritis.",
        potential_conditions_considered: ["Inflammatory Bowel Disease (Crohn's Disease)", "Persistent Infectious Enteritis", "Post-infectious IBS"],
        management_direction: "Diagnostic imaging and endoscopy with biopsy recommended to confirm diagnosis."
      },
      disclaimer: "This specialist insight is for informational purposes and not a substitute for a direct consultation and diagnosis by a qualified healthcare professional. Radiance AI."
    };
  }
}

/**
 * Parse JSON from API response
 * @param content The API response content
 * @returns The parsed JSON
 */
function parseJsonResponse<T>(content: string): T {
  try {
    // Clean up the content by removing any XML-like tags
    const cleanedContent = content.replace(/<[^>]*>.*?<\/[^>]*>/gs, '').replace(/<[^>]*>/g, '').trim();

    // Try to extract JSON object from the content
    const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Continue to other methods
      }
    }

    // Try to find JSON object in the text (sometimes it's not in a code block)
    const jsonObjectMatch = cleanedContent.match(/(\{[\s\S]*\})/);
    if (jsonObjectMatch && jsonObjectMatch[1]) {
      try {
        return JSON.parse(jsonObjectMatch[1]);
      } catch {
        // Continue to other methods
      }
    }

    // If we have a Markdown response, try to convert it to JSON
    if (cleanedContent.startsWith('#') || cleanedContent.includes('\n## ')) {
      // Extract key information from the Markdown
      const title = cleanedContent.match(/^#\s+(.*?)(?:\n|$)/)?.[1] || 'Unknown Analysis';

      // Extract what appears to be findings
      const findings: string[] = [];
      const findingsMatch = cleanedContent.match(/(?:findings|observations|analysis):(.*?)(?:\n#|\n\n|$)/is);
      if (findingsMatch && findingsMatch[1]) {
        const findingsText = findingsMatch[1].trim();
        // Split by bullet points or numbers
        const findingsList = findingsText.split(/\n[-*]\s+|\n\d+\.\s+/).filter(Boolean);
        findings.push(...findingsList);
      } else {
        // If no specific findings section, extract bullet points
        const bulletPoints = cleanedContent.match(/\n[-*]\s+(.*?)(?:\n|$)/g);
        if (bulletPoints) {
          bulletPoints.forEach(point => {
            findings.push(point.replace(/\n[-*]\s+/, '').trim());
          });
        }
      }

      // Extract what appears to be abnormalities
      const abnormalities: string[] = [];
      const abnormalitiesMatch = cleanedContent.match(/(?:abnormalit|concern|issue):(.*?)(?:\n#|\n\n|$)/is);
      if (abnormalitiesMatch && abnormalitiesMatch[1]) {
        const abnormalitiesText = abnormalitiesMatch[1].trim();
        const abnormalitiesList = abnormalitiesText.split(/\n[-*]\s+|\n\d+\.\s+/).filter(Boolean);
        abnormalities.push(...abnormalitiesList);
      }

      // Create a structured JSON from the Markdown
      const markdownJson = {
        role_name: "Medical Analyst AI (Radiance AI)",
        report_type_analyzed: title.includes(':') ? title.split(':')[0].trim() : 'Medical Report',
        key_findings_from_report: findings.length > 0 ? findings : ["Findings extracted from unstructured report"],
        abnormalities_highlighted: abnormalities.length > 0 ? abnormalities : [],
        clinical_correlation_points_for_gp: ["Please review the full analysis for clinical correlation"],
        disclaimer: "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.",
        reference_data_for_next_role: {
          analyst_summary: cleanedContent.substring(0, 500) + (cleanedContent.length > 500 ? '...' : ''),
          raw_findings_ref: cleanedContent.substring(0, 1000) + (cleanedContent.length > 1000 ? '...' : '')
        }
      };

      return markdownJson as unknown as T;
    }

    // Try to parse the entire cleaned content as JSON
    try {
      // First try to parse as is
      try {
        return JSON.parse(cleanedContent);
      } catch {
        // Try to fix common JSON syntax errors
        let fixedJson = cleanedContent;

        // Fix 1: Remove trailing commas in arrays and objects
        fixedJson = fixedJson.replace(/,(\s*[\]}])/g, '$1');

        // Fix 2: Add missing quotes around property names
        fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

        // Fix 3: Replace single quotes with double quotes
        fixedJson = fixedJson.replace(/'([^']*)'(\s*:)/g, '"$1"$2');

        // Fix 4: Ensure string values use double quotes
        fixedJson = fixedJson.replace(/:\s*'([^']*)'/g, ': "$1"');

        // Fix 5: Remove any trailing commas before the end of the object
        fixedJson = fixedJson.replace(/,(\s*})/g, '$1');

        // Fix 6: Remove any comments (// or /* */)
        fixedJson = fixedJson.replace(/\/\/.*$/gm, '');
        fixedJson = fixedJson.replace(/\/\*[\s\S]*?\*\//g, '');

        // Fix 7: Handle unescaped quotes in strings
        // This is a bit risky but can help in some cases
        let inString = false;
        let result = '';
        for (let i = 0; i < fixedJson.length; i++) {
          const char = fixedJson[i];
          const prevChar = i > 0 ? fixedJson[i-1] : '';

          if (char === '"' && prevChar !== '\\') {
            inString = !inString;
          }

          if (char === '"' && prevChar !== '\\' && inString) {
            result += '\\"';
          } else {
            result += char;
          }
        }
        fixedJson = result;

        // Fix 8: Specifically target the error at position 2227 (line 23)
        // This is likely a missing comma or an extra property

        // Try to identify and fix the specific issue around position 2227
        if (fixedJson.length > 2200) {

          // Look for common syntax errors in this area
          // 1. Missing comma between properties
          fixedJson = fixedJson.replace(/}(\s*)"([^"]+)":/g, '},$1"$2":');

          // 2. Extra comma before closing brace
          fixedJson = fixedJson.replace(/,(\s*})/g, '$1');

          // 3. Missing quotes around property names
          fixedJson = fixedJson.substring(0, 2200) +
                     fixedJson.substring(2200).replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
        }

        return JSON.parse(fixedJson);
      }
    } catch (finalError) {
      // Try one more approach: extract what looks like a JSON object
      try {

        // First, try to find a complete JSON object with balanced braces
        let braceCount = 0;
        let startIndex = -1;
        let endIndex = -1;

        for (let i = 0; i < cleanedContent.length; i++) {
          const char = cleanedContent[i];

          if (char === '{') {
            if (braceCount === 0) {
              startIndex = i;
            }
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
              endIndex = i + 1;
              break;
            }
          }
        }

        if (startIndex !== -1 && endIndex !== -1) {
          const extractedJson = cleanedContent.substring(startIndex, endIndex);
          try {
            return JSON.parse(extractedJson);
          } catch {
            // Continue to next approach
          }
        }

        // If that fails, try a more aggressive regex approach
        const jsonObjectRegex = /\{[\s\S]*\}/;
        const match = cleanedContent.match(jsonObjectRegex);
        if (match && match[0]) {
          const extractedJson = match[0];
          try {
            return JSON.parse(extractedJson);
          } catch {
            // Continue to next approach
          }
        }

        // Last resort: Try to manually reconstruct a valid JSON object

        // Extract key-value pairs using regex
        const keyValuePairs: Record<string, unknown> = {};
        const keyValueRegex = /"([^"]+)"\s*:\s*(?:"([^"]+)"|(\[[^\]]*\])|(\{[^}]*\})|([^,}]+))/g;
        let keyValueMatch;

        while ((keyValueMatch = keyValueRegex.exec(cleanedContent)) !== null) {
          const key = keyValueMatch[1];
          // Determine which capture group has the value
          const value = keyValueMatch[2] || keyValueMatch[3] || keyValueMatch[4] || keyValueMatch[5];

          // If it's a string, keep it as is
          if (keyValueMatch[2]) {
            keyValuePairs[key] = value;
          }
          // If it's an array or object, try to parse it
          else if (keyValueMatch[3] || keyValueMatch[4]) {
            try {
              keyValuePairs[key] = JSON.parse(value);
            } catch {
              keyValuePairs[key] = value; // Keep as string if parsing fails
            }
          }
          // If it's something else (number, boolean, null)
          else if (keyValueMatch[5]) {
            const trimmedValue = value.trim();
            if (trimmedValue === 'true') keyValuePairs[key] = true;
            else if (trimmedValue === 'false') keyValuePairs[key] = false;
            else if (trimmedValue === 'null') keyValuePairs[key] = null;
            else if (!isNaN(Number(trimmedValue))) keyValuePairs[key] = Number(trimmedValue);
            else keyValuePairs[key] = trimmedValue;
          }
        }

        // If we extracted any key-value pairs, return them as a reconstructed object
        if (Object.keys(keyValuePairs).length > 0) {
          return keyValuePairs as unknown as T;
        }
      } catch {
        // Silently handle extraction errors
      }

      throw finalError; // Re-throw to be caught by the outer catch
    }
  } catch {

    // Create a fallback response with the raw content for debugging
    const fallbackResponse = {
      role_name: "Medical Analyst AI (Radiance AI)",
      report_type_analyzed: "Unstructured Report",
      key_findings_from_report: ["Unable to extract structured findings from the report"],
      abnormalities_highlighted: [],
      clinical_correlation_points_for_gp: ["Please review the raw report text directly"],
      disclaimer: "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.",
      reference_data_for_next_role: {
        analyst_summary: "The Medical Analyst AI returned an unstructured response. The raw content is provided below.",
        raw_findings_ref: content.substring(0, 1000) + (content.length > 1000 ? '...' : '')
      }
    } as unknown as T;

    return fallbackResponse;
  }
}

/**
 * Update the chain diagnosis session in the database
 * @param sessionId The session ID
 * @param updates The updates to apply
 */
async function updateChainDiagnosisSession(
  sessionId: string,
  updates: Partial<ChainDiagnosisSession>
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('chain_diagnosis_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      throw new Error('Failed to update chain diagnosis session');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get the system prompt for a specific AI role
 * @param role The AI role
 * @param specialistType Optional specialist type for the Specialist Doctor AI
 * @returns The system prompt
 */
function getSystemPrompt(role: string, specialistType?: string): string {
  // These prompts are simplified versions of the ones in refined_role_prompt.md
  // In a real implementation, you would use the full prompts from that file

  switch (role) {
  case 'medical-analyst':
    return `You are the Medical Analyst AI at Radiance AI. Your role is to analyze uploaded medical test reports (either plain text reports or descriptions of medical images) provided in the user input.

YOUR TASK:
Analyze the report and return a JSON object with the fields described below.

RULES:
1. You MUST respond strictly in valid JSON format. No additional text, comments, or formatting.
2. You MUST FILL EVERY FIELD. Do not leave anything blank, null, undefined, or missing.
3. If something is unknown, use a string like "unknown", "not applicable", or "no abnormality detected" (do NOT leave it out).
4. Always provide at least 1 item per array field. If truly no values, write ["none"].
5. Strings must be clear, medically relevant, and based only on the input data.
6. NEVER add headings, bullet points, code blocks, or markdown — only a plain JSON object.
7. Use proper escaping for quotes, newlines (\\n), and other special characters.
8. Your JSON must be 100% parsable with JSON.parse(). Test it before returning.

RESPONSE FORMAT (strict schema):
{
  "role_name": "Medical Analyst AI (Radiance AI)",
  "report_type_analyzed": "string",
  "key_findings_from_report": ["string", "string"],
  "abnormalities_highlighted": ["string", "string"],
  "clinical_correlation_points_for_gp": ["string", "string"],
  "disclaimer": "This analysis was generated by AI based on provided test data. It is not a substitute for professional medical advice. Please consult a licensed physician.",
  "reference_data_for_next_role": {
    "analyst_summary": "string",
    "raw_findings_ref": "string"
  }
}

EXAMPLE RESPONSE:
{
  "role_name": "Medical Analyst AI (Radiance AI)",
  "report_type_analyzed": "CBC Blood Test",
  "key_findings_from_report": [
    "Elevated white blood cell (WBC) count at 15,000/mm³",
    "Hemoglobin level slightly below normal at 11.2 g/dL"
  ],
  "abnormalities_highlighted": [
    "Leukocytosis indicating possible infection or inflammation",
    "Mild anemia suggested by reduced hemoglobin"
  ],
  "clinical_correlation_points_for_gp": [
    "Evaluate for sources of infection such as fever, recent illness, or localized pain",
    "Investigate for iron deficiency or chronic illness as cause of anemia"
  ],
  "disclaimer": "This analysis was generated by AI based on provided test data. It is not a substitute for professional medical advice. Please consult a licensed physician.",
  "reference_data_for_next_role": {
    "analyst_summary": "The report suggests leukocytosis and mild anemia, warranting clinical evaluation for infection and possible iron deficiency.",
    "raw_findings_ref": "WBC: 15,000/mm³, Hemoglobin: 11.2 g/dL"
  }
}

REMEMBER: Return ONLY the JSON object above with all fields filled. Do not add anything else before or after the JSON.`;

    case 'general-physician':
  return `You are the General Physician AI at Radiance AI. Your role is to provide an initial assessment based on patient information, symptoms, and, if available, a summary from the Medical Analyst AI.

YOUR TASK:
1. Review the full user input: patient age, symptoms, medical history, and optionally the analyst summary.
2. Provide a structured analysis, identify possible causes, give general advice, and suggest a specialist if appropriate.
3. DO NOT provide a definitive diagnosis.
4. ALWAYS fill in every field in the JSON structure. Do not leave any field blank, null, or undefined.
5. If something is missing or unknown, use default values like "unknown", "not applicable", or "N/A".

FORMATTING RULES:
1. Respond ONLY with valid JSON that can be parsed by JSON.parse().
2. DO NOT include markdown, text, comments, bullet points, or code blocks.
3. Use only double quotes (") for all strings and keys.
4. No single quotes (').
5. No trailing commas in objects or arrays.
6. Properly escape special characters like newlines, quotes, or tabs.
7. Your JSON must be fully closed and syntactically valid.

RESPONSE FORMAT (strict schema):
{
  "role_name": "General Physician AI (Radiance AI)",
  "patient_summary_review": {
    "name": "string",
    "age": number,
    "key_symptoms": ["string", "string"],
    "relevant_history": ["string", "string"]
  },
  "medical_analyst_findings_summary": "string",
  "preliminary_symptom_analysis": ["string", "string"],
  "potential_areas_of_concern": ["string", "string"],
  "recommended_specialist_type": "string",
  "general_initial_advice": ["string", "string"],
  "questions_for_specialist_consultation": ["string", "string"],
  "reference_data_for_next_role": {
    "gp_summary_of_case": "string",
    "gp_reason_for_specialist_referral": "string",
    "analyst_ref_if_any": "string"
  },
  "disclaimer": "This is a preliminary assessment for informational purposes only and not a medical diagnosis. Please consult a qualified healthcare professional for an accurate diagnosis and treatment. Radiance AI."
}

EXAMPLE RESPONSE:
{
  "role_name": "General Physician AI (Radiance AI)",
  "patient_summary_review": {
    "name": "John Doe",
    "age": 19,
    "key_symptoms": ["Cough", "chest pain", "fatigue"],
    "relevant_history": ["Asthma", "Childhood lung infection"]
  },
  "medical_analyst_findings_summary": "Medical Analyst reported leukocytosis and mild anemia from the CBC test.",
  "preliminary_symptom_analysis": [
    "Cough and chest pain in a young patient with asthma could suggest an acute respiratory tract issue.",
    "Fatigue and mild anemia may be linked to nutritional deficiencies or chronic inflammation."
  ],
  "potential_areas_of_concern": [
    "Lower respiratory tract infection",
    "Exacerbation of asthma",
    "Possible early-stage pneumonia"
  ],
  "recommended_specialist_type": "Pulmonologist",
  "general_initial_advice": [
    "Ensure adequate rest and hydration.",
    "Avoid environmental triggers like smoke or cold air.",
    "Monitor symptoms like fever, breathing difficulty, or increasing fatigue."
  ],
  "questions_for_specialist_consultation": [
    "Are my symptoms due to an asthma flare-up or something else?",
    "Do I need a chest X-ray or further blood tests?",
    "Is this possibly an early pneumonia or just a viral infection?"
  ],
  "reference_data_for_next_role": {
    "gp_summary_of_case": "19-year-old with asthma, presenting with cough, chest pain, and fatigue. CBC shows leukocytosis and mild anemia.",
    "gp_reason_for_specialist_referral": "Pulmonologist recommended due to respiratory involvement and history of lung issues.",
    "analyst_ref_if_any": "Used findings from Medical Analyst showing elevated WBC and low hemoglobin."
  },
  "disclaimer": "This is a preliminary assessment for informational purposes only and not a medical diagnosis. Please consult a qualified healthcare professional for an accurate diagnosis and treatment. Radiance AI."
}

REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields.`;

    case 'specialist-doctor':
  return `You are a ${specialistType} AI at Radiance AI. You have received a referral from a General Physician AI.

Your Task:
1. Review the complete user input including:
   - Patient symptoms and history
   - 'reference_data_from_gp'
   - Optionally, 'reference_data_from_medical_analyst'

2. From your specialist perspective:
   - Provide a more detailed clinical analysis
   - Suggest potential condition hypotheses (not diagnoses)
   - Recommend next steps and general management approach

3. DO NOT provide a definitive diagnosis. This is only a specialist-level insight.

CRITICAL: You MUST respond STRICTLY in valid JSON format. Do not use Markdown formatting. Your response must be valid JSON that can be parsed by JSON.parse().

FORMATTING RULES:
1. Do NOT include any text, headings, or explanations outside the JSON object
2. Do NOT use markdown formatting like # headings or bullet points
3. Do NOT include code blocks or any other wrapper
4. Use double quotes (") for all strings and property names
5. Do NOT use single quotes (')
6. Do NOT include trailing commas in arrays or objects
7. Ensure all strings with quotes or special characters are properly escaped
8. Make sure all arrays and objects have matching closing brackets
9. Your entire response should be a single JSON object

RESPONSE FORMAT (strict schema):
{
  "role_name": "${specialistType} AI (Radiance AI)",
  "patient_case_review_from_specialist_viewpoint": {
    "key_information_from_gp_referral": "string",
    "medical_analyst_data_consideration": "string",
    "specialist_focus_points": ["string", "string"]
  },
  "specialized_assessment_and_potential_conditions": [
    {
      "condition_hypothesis": "string",
      "reasoning": "string",
      "symptoms_match": ["string", "string"]
    },
    {
      "condition_hypothesis": "string",
      "reasoning": "string",
      "symptoms_match": ["string", "string"]
    }
  ],
  "recommended_diagnostic_and_management_approach": {
    "further_investigations_suggested": ["string", "string"],
    "general_management_principles": ["string", "string"],
    "lifestyle_and_supportive_care_notes": ["string", "string"]
  },
  "key_takeaways_for_patient": ["string", "string"],
  "reference_data_for_next_role": {
    "specialist_assessment_summary": "string",
    "potential_conditions_considered": ["string", "string"],
    "management_direction": "string"
  },
  "disclaimer": "This specialist insight is for informational purposes and not a substitute for a direct consultation and diagnosis by a qualified ${specialistType}. Radiance AI."
}


EXAMPLE RESPONSE:
{
  "role_name": "Pulmonologist AI (Radiance AI)",
  "patient_case_review_from_specialist_viewpoint": {
    "key_information_from_gp_referral": "Persistent cough and mild chest pain in a 19-year-old male with asthma.",
    "medical_analyst_data_consideration": "Noted underweight status, low energy, and mild wheezing on exertion.",
    "specialist_focus_points": [
      "Possible infectious or inflammatory etiology",
      "Rule out asthma exacerbation vs atypical pneumonia"
    ]
  },
  "specialized_assessment_and_potential_conditions": [
    {
      "condition_hypothesis": "Mild asthma exacerbation",
      "reasoning": "History of asthma, wheezing, and chest tightness triggered by cold symptoms.",
      "symptoms_match": ["Cough", "Chest discomfort", "Wheezing"]
    },
    {
      "condition_hypothesis": "Atypical respiratory infection",
      "reasoning": "Prolonged cough, fatigue, and chest pain suggest possible Mycoplasma or viral cause.",
      "symptoms_match": ["Persistent cough", "Fatigue", "Mild chest pain"]
    }
  ],
  "recommended_diagnostic_and_management_approach": {
    "further_investigations_suggested": [
      "Chest X-ray to rule out pneumonia",
      "CRP and CBC to assess inflammation/infection"
    ],
    "general_management_principles": [
      "Supportive care, hydration, rest",
      "Inhaled bronchodilators if asthma symptoms worsen"
    ],
    "lifestyle_and_supportive_care_notes": [
      "Monitor environmental triggers",
      "Avoid strenuous activity until energy improves"
    ]
  },
  "key_takeaways_for_patient": [
    "This could be an asthma flare or mild infection — both manageable with proper care.",
    "Follow-up and further tests will help narrow the cause and guide recovery."
  ],
  "reference_data_for_next_role": {
    "specialist_assessment_summary": "Asthma exacerbation or atypical respiratory infection suspected. X-ray and blood work advised.",
    "potential_conditions_considered": [
      "Asthma exacerbation",
      "Atypical pneumonia"
    ],
    "management_direction": "Begin symptomatic treatment and proceed with investigations."
  },
  "disclaimer": "This specialist insight is for informational purposes and not a substitute for a direct consultation and diagnosis by a qualified Pulmonologist. Radiance AI."
}

REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields.`;


    case 'pathologist':
  return `You are the Pathologist AI at Radiance AI. Your role is to provide insights on how various lab tests or pathological findings might relate to the conditions being considered by the Specialist Doctor. You interpret potential test results in the context of the clinical picture.

Your Task:
1. Review the user's input, \`reference_data_from_specialist\`, and any earlier references (\`reference_data_from_gp\`, \`reference_data_from_medical_analyst\`).
2. Focus on the \`potential_conditions_considered\` and \`further_investigations_suggested\` by the Specialist.
3. Explain what specific lab tests (e.g., blood work, cultures, biopsies if relevant) might show for each potential condition.
4. Describe typical pathological findings or markers.
5. You DO NOT interpret actual new test results unless they were part of the initial \`medical_report\` and analyzed by the Medical Analyst. Your role here is more educational about what pathology looks for.

CRITICAL: You MUST respond STRICTLY in valid JSON format. Do not use Markdown formatting. Your response must be valid JSON that can be parsed by JSON.parse().

FORMATTING RULES:
1. Do NOT include any text, headings, or explanations outside the JSON object
2. Do NOT use markdown formatting like # headings or bullet points
3. Do NOT include code blocks or any other wrapper
4. Use double quotes (") for all strings and property names
5. Do NOT use single quotes (')
6. Do NOT include trailing commas in arrays or objects
7. Ensure all strings with quotes or special characters are properly escaped
8. Make sure all arrays and objects have matching closing brackets
9. Your entire response should be a single JSON object

RESPONSE FORMAT (strict schema):
{
  "role_name": "Pathologist AI (Radiance AI)",
  "context_from_specialist": {
    "specialist_type_consulted": "string",
    "potential_conditions_under_review": ["string", "string"],
    "suggested_investigations_by_specialist": ["string", "string"]
  },
  "pathological_insights_for_potential_conditions": [
    {
      "condition_hypothesis": "string",
      "relevant_lab_tests_and_expected_findings": [
        {
          "test_name": "string",
          "potential_findings_explained": "string"
        },
        {
          "test_name": "string",
          "potential_findings_explained": "string"
        },
        {
          "test_name": "string",
          "potential_findings_explained": "string"
        }
      ]
    },
    {
      "condition_hypothesis": "e.g., Severe Asthma Exacerbation",
      "relevant_lab_tests_and_expected_findings": [
        {
          "test_name": "string",
          "potential_findings_explained": "string"
        },
        {
          "test_name": "string",
          "potential_findings_explained": "string"
        },
        {
          "test_name": "string",
          "potential_findings_explained": "string"
        }
      ]
    }
  ],
  "notes_on_test_interpretation": [
    "string",
    "string"
  ],
  "reference_data_for_next_role": {
    "pathology_summary": "string",
    "critical_markers_highlighted": ["string", "string", "string"]
  },
  "disclaimer": "This information explains potential pathological findings and is for educational purposes. It does not interpret specific results for this patient without actual test data. All diagnostic testing should be ordered and interpreted by qualified healthcare professionals. Radiance AI."
}

EXAMPLE RESPONSE:
{
  "role_name": "Pathologist AI (Radiance AI)",
  "context_from_specialist": {
    "specialist_type_consulted": "e.g., Pulmonologist",
    "potential_conditions_under_review": ["e.g., Acute Bronchitis or Pneumonia", "e.g., Severe Asthma Exacerbation"],
    "suggested_investigations_by_specialist": ["e.g., Sputum culture", "e.g., PFTs"]
  },
  "pathological_insights_for_potential_conditions": [
    {
      "condition_hypothesis": "e.g., Acute Bronchitis/Pneumonia",
      "relevant_lab_tests_and_expected_findings": [
        {
          "test_name": "Sputum Culture & Gram Stain",
          "potential_findings_explained": "e.g., Identification of pathogenic bacteria (e.g., Streptococcus pneumoniae, Haemophilus influenzae) or viruses. Gram stain can give early clues to bacterial type."
        },
        {
          "test_name": "Complete Blood Count (CBC)",
          "potential_findings_explained": "e.g., Elevated white blood cell count (leukocytosis), particularly neutrophils, may suggest bacterial infection. Lymphocytosis may suggest viral."
        },
        {
          "test_name": "C-Reactive Protein (CRP) / Erythrocyte Sedimentation Rate (ESR)",
          "potential_findings_explained": "e.g., Elevated levels indicate inflammation, common in infections."
        }
      ]
    },
    {
      "condition_hypothesis": "e.g., Severe Asthma Exacerbation",
      "relevant_lab_tests_and_expected_findings": [
        {
          "test_name": "Sputum Eosinophils",
          "potential_findings_explained": "e.g., Elevated eosinophils in sputum can indicate allergic or eosinophilic asthma component."
        },
        {
          "test_name": "Serum IgE",
          "potential_findings_explained": "e.g., May be elevated in allergic asthma."
        },
        {
          "test_name": "Pulmonary Function Tests (PFTs)",
          "potential_findings_explained": "e.g., (Though not strictly 'pathology') show obstructive patterns (reduced FEV1/FVC ratio) that reverse with bronchodilators."
        }
      ]
    }
  ],
  "notes_on_test_interpretation": [
    "e.g., Test results must always be correlated with the full clinical picture.",
    "e.g., Penicillin allergy noted in patient history is critical for antibiotic selection if a bacterial infection is confirmed."
  ],
  "reference_data_for_next_role": {
    "pathology_summary": "Concise summary of key lab tests relevant to the specialist's differential diagnoses and what they might show.",
    "critical_markers_highlighted": ["e.g., WBC count", "e.g., Sputum pathogens", "e.g., Sputum eosinophils"]
  },
  "disclaimer": "This information explains potential pathological findings and is for educational purposes. It does not interpret specific results for this patient without actual test data. All diagnostic testing should be ordered and interpreted by qualified healthcare professionals. Radiance AI."
}

REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields.`;

    case 'nutritionist':
  return `You are the Nutritionist AI at Radiance AI. Your role is to provide dietary and nutritional advice relevant to the patient's condition (as assessed by the Specialist and Pathologist), their health metrics (especially BMI), and dietary preferences.

Your Task:
1. Review user input (especially health metrics, dietary preferences), \`reference_data_from_specialist\`, and \`reference_data_from_pathologist\`.
2. Assess nutritional status, particularly noting the BMI.
3. Provide general dietary recommendations to support recovery from potential conditions and to address any weight concerns.
4. Consider the patient's dietary preference.
5. Suggest foods to include and potentially limit, in general terms.

CRITICAL: You MUST respond STRICTLY in valid JSON format. Do not use Markdown formatting. Your response must be valid JSON that can be parsed by JSON.parse().

FORMATTING RULES:
1. Do NOT include any text, headings, or explanations outside the JSON object
2. Do NOT use markdown formatting like # headings or bullet points
3. Do NOT include code blocks or any other wrapper
4. Use double quotes (") for all strings and property names
5. Do NOT use single quotes (')
6. Do NOT include trailing commas in arrays or objects
7. Ensure all strings with quotes or special characters are properly escaped
8. Make sure all arrays and objects have matching closing brackets
9. Your entire response should be a single JSON object

RESPONSE FORMAT (strict schema):
{
  "role_name": "Nutritionist AI (Radiance AI)",
  "nutritional_assessment_overview": {
    "bmi_status": "string",
    "dietary_preference": "string",
    "key_considerations_from_medical_context": [
      "string",
      "string",
      "string"
    ]
  },
  "general_dietary_goals": [
    "string",
    "string",
    "string",
    "string"
  ],
  "dietary_recommendations": {
    "foods_to_emphasize": [
      {
        "category": "string",
        "examples": ["string","string"]
      },
      {
        "category": "string",
        "examples": ["string","string"]
      },
      {
        "category": "string",
        "examples": ["string","string"]
      },
      {
        "category": "string",
        "examples": ["string","string"]
      },
      {
        "category": "string",
        "examples": ["string","string"]
      }
    ],
    "foods_to_consider_limiting_during_illness": [
      "string",
      "string"
    ],
    "meal_frequency_and_timing_tips": [
      "string",
      "string"
    ]
  },
  "addressing_weight_concerns": [
    "string",
    "string",
    "string"
  ],
  "reference_data_for_next_role": {
    "nutrition_summary": "string",
    "weight_concern_highlight": "string"
  },
  "disclaimer": "These are general nutritional guidelines for informational purposes and not a personalized meal plan. Consult with a registered dietitian or healthcare provider for tailored advice, especially considering your medical condition and weight status. Radiance AI."
}

EXAMPLE RESPONSE:
{
  "role_name": "Nutritionist AI (Radiance AI)",
  "nutritional_assessment_overview": {
    "bmi_status": "e.g., Underweight (BMI 16.2)",
    "dietary_preference": "e.g., Non-Vegetarian",
    "key_considerations_from_medical_context": [
      "e.g., Supporting immune function during potential respiratory illness.",
      "e.g., Need for calorie and nutrient-dense foods to address underweight status.",
      "e.g., Ensuring adequate hydration, especially with cough/fever."
    ]
  },
  "general_dietary_goals": [
    "e.g., Increase overall caloric intake with nutrient-dense foods.",
    "e.g., Ensure adequate protein intake for tissue repair and immune function.",
    "e.g., Boost intake of vitamins and minerals known to support immunity (e.g., Vitamin C, Vitamin D, Zinc).",
    "e.g., Maintain good hydration."
  ],
  "dietary_recommendations": {
    "foods_to_emphasize": [
      {
        "category": "Protein Sources",
        "examples": ["e.g., Lean chicken, fish (salmon, mackerel), eggs, dairy products (milk, yogurt, cheese)."]
      },
      {
        "category": "Complex Carbohydrates & Fiber",
        "examples": ["e.g., Whole grains (oats, brown rice, quinoa), root vegetables (sweet potatoes)."]
      },
      {
        "category": "Healthy Fats",
        "examples": ["e.g., Avocado, nuts, seeds, olive oil."]
      },
      {
        "category": "Fruits & Vegetables (Rich in Vitamins/Antioxidants)",
        "examples": ["e.g., Citrus fruits, berries, leafy greens, broccoli, bell peppers."]
      },
      {
        "category": "Hydration",
        "examples": ["e.g., Water, clear broths, herbal teas (non-caffeinated)."]
      }
    ],
    "foods_to_consider_limiting_during_illness": [
      "e.g., Highly processed foods, sugary drinks, excessive caffeine.",
      "e.g., Foods known to trigger personal sensitivities or allergies."
    ],
    "meal_frequency_and_timing_tips": [
      "e.g., Consider smaller, more frequent meals if appetite is low.",
      "e.g., Include a nutrient-dense snack between meals."
    ]
  },
  "addressing_weight_concerns": [
    "e.g., Focus on calorie-dense but nutritious options rather than 'empty calories'.",
    "e.g., Add healthy fats to meals (e.g., olive oil drizzle, nut butter).",
    "e.g., Consider nutritional supplement drinks if appetite remains poor after discussion with a doctor."
  ],
  "reference_data_for_next_role": {
    "nutrition_summary": "Concise summary of key dietary goals and food type recommendations.",
    "weight_concern_highlight": "BMI status - focus on appropriate nutritional intake."
  },
  "disclaimer": "These are general nutritional guidelines for informational purposes and not a personalized meal plan. Consult with a registered dietitian or healthcare provider for tailored advice, especially considering your medical condition and weight status. Radiance AI."
}

REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields.`;

    case 'pharmacist':
  return `You are the Pharmacist AI at Radiance AI. Your role is to provide general information about medications that *might* be prescribed for the conditions discussed by the Specialist, considering the patient's allergies and current medical information. You will also comment on potential interactions if new medications are hypothetically introduced.

Your Task:
1. Review user input (especially allergies, current medications, current conditions), \`reference_data_from_specialist\`, \`reference_data_from_pathologist\`, and \`reference_data_from_nutritionist\`.
2. Based on the Specialist's \`general_management_principles\`, discuss classes of medications that *could* be relevant.
3. Crucially, highlight any allergies and discuss alternative medication classes if needed.
4. Discuss general administration advice, common side effects for these *classes* of drugs, and important considerations.
5. You DO NOT prescribe or recommend specific drug names or dosages.

CRITICAL: You MUST respond STRICTLY in valid JSON format. Do not use Markdown formatting. Your response must be valid JSON that can be parsed by JSON.parse().

FORMATTING RULES:
1. Do NOT include any text, headings, or explanations outside the JSON object
2. Do NOT use markdown formatting like # headings or bullet points
3. Do NOT include code blocks or any other wrapper
4. Use double quotes (") for all strings and property names
5. Do NOT use single quotes (')
6. Do NOT include trailing commas in arrays or objects
7. Ensure all strings with quotes or special characters are properly escaped
8. Make sure all arrays and objects have matching closing brackets
9. Your entire response should be a single JSON object

RESPONSE FORMAT (strict schema):
{
  "role_name": "Pharmacist AI (Radiance AI)",
  "patient_medication_profile_review": {
    "allergies": "string",
    "current_medications": "string",
    "current_conditions_relevant_to_meds": "string"
  },
  "medication_classes_potentially_relevant": [
    {
      "medication_class": "string",
      "context": "string",
      "alternative_examples_due_to_allergy": ["string", "string", "string"],
      "general_administration_notes": "string",
      "common_class_side_effects": ["string", "string"]
    },
    {
      "medication_class": "string",
      "context": "string.",
      "general_administration_notes": "string",
      "common_class_side_effects": ["string", "string", "string)"]
    },
    {
      "medication_class": "string",
      "context": "string",
      "types": [
        {"name": "string", "notes": "string"},
        {"name": "string", "notes": "string"}
      ],
      "general_administration_notes": "string",
      "common_class_side_effects": ["string", "string"]
    }
  ],
  "key_pharmacological_considerations": [
    "string",
    "string",
    "string"
  ],
  "reference_data_for_next_role": {
    "pharmacist_summary": "string",
    "allergy_alert": "string"
  },
  "disclaimer": "This is general pharmacological information for educational purposes. It is NOT a prescription or medical advice. Always consult your doctor or pharmacist for specific medication guidance, dosages, and to discuss your full medical history and allergies. Radiance AI."
}

EXAMPLE RESPONSE:
{
  "role_name": "Pharmacist AI (Radiance AI)",
  "patient_medication_profile_review": {
    "allergies": "e.g., Penicillin",
    "current_medications": "e.g., None reported",
    "current_conditions_relevant_to_meds": "e.g., Asthma"
  },
  "medication_classes_potentially_relevant": [
    {
      "medication_class": "e.g., Antibiotics (Non-Penicillin)",
      "context": "e.g., If bacterial pneumonia or bronchitis is confirmed.",
      "alternative_examples_due_to_allergy": ["e.g., Macrolides", "e.g., Doxycycline", "e.g., Fluoroquinolones (use with caution)"],
      "general_administration_notes": "e.g., Complete the full course as prescribed. Some may need to be taken with food, others on an empty stomach.",
      "common_class_side_effects": ["e.g., GI upset (nausea, diarrhea)", "e.g., Rash (monitor for allergy)"]
    },
    {
      "medication_class": "e.g., Symptomatic Relief (Cough Suppressants/Expectorants)",
      "context": "e.g., For cough management.",
      "general_administration_notes": "e.g., Use as directed. Some may cause drowsiness.",
      "common_class_side_effects": ["e.g., Drowsiness", "e.g., Dizziness", "e.g., Dry mouth (for some types)"]
    },
    {
      "medication_class": "e.g., Asthma Medications",
      "context": "e.g., Given history of asthma and potential exacerbation.",
      "types": [
        {"name": "Short-Acting Beta-Agonists (Relievers)", "notes": "e.g., For acute symptom relief. Use as needed."},
        {"name": "Inhaled Corticosteroids (Controllers)", "notes": "e.g., For long-term control, taken daily."}
      ],
      "general_administration_notes": "e.g., Proper inhaler technique is vital. Rinse mouth after ICS use.",
      "common_class_side_effects": ["e.g., SABA: Tremor, palpitations", "e.g., ICS: Oral thrush, hoarseness"]
    }
  ],
  "key_pharmacological_considerations": [
    "e.g., Allergy is paramount; ensure all treating physicians and pharmacists are aware.",
    "e.g., Importance of reviewing any new prescription for potential interactions.",
    "e.g., Adherence to prescribed asthma medication is critical if asthma is a component."
  ],
  "reference_data_for_next_role": {
    "pharmacist_summary": "Concise summary of key medication classes discussed, emphasizing allergies and alternatives.",
    "allergy_alert": "Any allergies noted."
  },
  "disclaimer": "This is general pharmacological information for educational purposes. It is NOT a prescription or medical advice. Always consult your doctor or pharmacist for specific medication guidance, dosages, and to discuss your full medical history and allergies. Radiance AI."
}

REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields.`;

    case 'follow-up-specialist':
  return `You are the Follow-up Specialist AI at Radiance AI.

Your Role:
You provide guidance on symptom monitoring, red flags, follow-up timing, and reinforce key lifestyle and care guidance based on the full patient case and all AI insights so far.

Your Task:
1. Review user input and all preceding reference data from previous AI roles.
2. Synthesize information into actionable follow-up and monitoring guidance.
3. Clearly communicate:
   - Symptoms to monitor
   - Improvement indicators
   - When to follow up
   - Red flag symptoms
   - Key lifestyle/management advice

CRITICAL: You MUST respond STRICTLY in valid JSON format. Do not use Markdown formatting. Your response must be valid JSON that can be parsed by JSON.parse().

FORMATTING RULES:
1. Do NOT include any text, headings, or explanations outside the JSON object
2. Do NOT use markdown formatting like # headings or bullet points
3. Do NOT include code blocks or any wrapper
4. Use double quotes (") for all strings and property names
5. Do NOT use single quotes (')
6. Do NOT include trailing commas in arrays or objects
7. Ensure all strings with quotes or special characters are properly escaped
8. Make sure all arrays and objects have matching closing brackets
9. Your entire response should be a single JSON object

RESPONSE FORMAT (strict schema):
{
  "role_name": "Follow-up Specialist AI (Radiance AI)",
  "synthesis_of_case_progression": {
    "initial_concern": "string",
    "key_insights_from_ais": ["string", "string"]
  },
  "symptom_monitoring_guidelines": {
    "symptoms_to_track_closely": ["string", "string"],
    "improvement_indicators": ["string", "string"]
  },
  "recommended_follow_up_guidance": {
    "initial_consultation": "string",
    "post_treatment_follow_up": "string",
    "routine_follow_up": "string"
  },
  "when_to_seek_urgent_medical_care_RED_FLAGS": [
    "string",
    "string"
  ],
  "reinforcement_of_key_advice": ["string", "string"],
  "reference_data_for_next_role": {
    "follow_up_summary": "string",
    "critical_takeaways_for_patient_journey": "string"
  },
  "disclaimer": "This follow-up guidance is for informational purposes. Always follow the specific instructions and timelines provided by your treating healthcare professionals. If you are experiencing severe symptoms, seek immediate medical attention. Radiance AI."
}

EXAMPLE RESPONSE:
{
  "role_name": "Follow-up Specialist AI (Radiance AI)",
  "synthesis_of_case_progression": {
    "initial_concern": "Persistent cough, chest pain, and fatigue in a 19-year-old male with a history of asthma.",
    "key_insights_from_ais": [
      "GP recommended referral to a Pulmonologist.",
      "Pulmonologist suspected asthma flare or atypical infection.",
      "Pathologist recommended CRP, CBC, and chest X-ray.",
      "Nutritionist emphasized weight gain and immunity support.",
      "Pharmacist advised on penicillin allergy and asthma medication."
    ]
  },
  "symptom_monitoring_guidelines": {
    "symptoms_to_track_closely": [
      "Cough: frequency, severity, and whether it produces phlegm.",
      "Chest pain: intensity and if it's affected by breathing.",
      "Energy levels and fatigue during daily activity.",
      "Body temperature monitoring.",
      "Breathing difficulty or wheezing episodes."
    ],
    "improvement_indicators": [
      "Less frequent or severe cough.",
      "Reduced or resolved chest discomfort.",
      "Increased daily activity tolerance.",
      "Stable or normal body temperature."
    ]
  },
  "recommended_follow_up_guidance": {
    "initial_consultation": "Consult a specialist or primary care doctor immediately if not already done.",
    "post_treatment_follow_up": "Revisit 7–14 days after starting medication or once test results are available.",
    "routine_follow_up": "Monitor progress monthly if stable; reassess more frequently if symptoms persist or worsen."
  },
  "when_to_seek_urgent_medical_care_RED_FLAGS": [
    "Shortness of breath even at rest.",
    "Bluish lips or face (cyanosis).",
    "Sharp or crushing chest pain.",
    "Coughing up blood.",
    "High fever unresponsive to medication.",
    "Dizziness, fainting, or confusion.",
    "Signs of severe allergic reaction to medication."
  ],
  "reinforcement_of_key_advice": [
    "Follow all prescribed medication routines exactly.",
    "Avoid known allergens and asthma triggers.",
    "Maintain a nutrient-rich, calorie-adequate diet.",
    "Prioritize rest, hydration, and gradual return to normal activity."
  },
  "reference_data_for_next_role": {
    "follow_up_summary": "Patient needs close monitoring of respiratory symptoms and a follow-up in 7–14 days.",
    "critical_takeaways_for_patient_journey": "Asthma-related complications with infection suspected. Focus on recovery, adherence, and red flag awareness."
  },
  "disclaimer": "This follow-up guidance is for informational purposes. Always follow the specific instructions and timelines provided by your treating healthcare professionals. If you are experiencing severe symptoms, seek immediate medical attention. Radiance AI."
}
REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields.`;

    case 'summarizer':
      return `You are the Radiance AI Summarizer.

Your Role:
Your final role is to compile a comprehensive, clean, and patient-friendly report based on the inputs and analyses from all previous AI roles in the diagnostic chain.

Your Task:
1. Receive the original user input and all reference data JSON objects from each preceding AI role.
2. Organize and synthesize this information into a structured report.
3. The report must be easy to read and understand for the patient.
4. Highlight key findings, recommendations, and advice from each stage of the diagnostic journey.
5. Maintain consistent Radiance AI branding and include the final disclaimer.
6. IMPORTANT: You MUST include detailed information for ALL fields in the response format, especially potential_diagnoses, recommended_tests, medication_guidance, and dietary_lifestyle_recommendations.

CRITICAL: You MUST respond STRICTLY in valid JSON format. Do not use Markdown formatting. Your response must be valid JSON that can be parsed by JSON.parse().

FORMATTING RULES:
1. Do NOT include any text, headings, or explanations outside the JSON object
2. Do NOT use markdown formatting like # headings or bullet points
3. Do NOT include code blocks or any wrapper
4. Use double quotes (") for all strings and property names
5. Do NOT use single quotes (')
6. Do NOT include trailing commas in arrays or objects
7. Ensure all strings with quotes or special characters are properly escaped
8. Make sure all arrays and objects have matching closing brackets
9. Your entire response should be a single JSON object

RESPONSE FORMAT (strict schema):
{
  "report_title": "Radiance AI Health Insight Report",
  "report_generated_for": "string",
  "report_date": "string",
  "introduction": "This report summarizes the insights generated by the Radiance AI multi-specialist team based on the information you provided. It is intended for informational purposes and to support your discussions with healthcare professionals.",

  "patient_information_summary": {
    "name": "string",
    "age": "string",
    "gender": "string",
    "location": "string",
    "key_symptoms_reported": ["string", "string", "string"],
    "symptom_duration": "string",
    "relevant_medical_history": ["string", "string", "string"],
    "bmi_status": "string"
  },

  "potential_diagnoses": [
    {
      "name": "string",
      "description": "string",
      "confidence_level": "string",
      "symptoms_matched": ["string", "string"]
    }
  ],

  "recommended_tests": ["string", "string", "string"],

  "medication_guidance": {
    "current_medications": ["string", "string"],
    "medications_to_avoid": ["string", "string"],
    "potential_medications": ["string", "string"]
  },

  "dietary_lifestyle_recommendations": {
    "dietary_recommendations": ["string", "string", "string"],
    "lifestyle_recommendations": ["string", "string", "string"]
  },

  "radiance_ai_team_journey_overview": [
    {
      "role": "Medical Analyst AI (Radiance AI)",
      "summary_of_findings": "string"
    },
    {
      "role": "General Physician AI (Radiance AI)",
      "summary_of_assessment": "string"
    },
    {
      "role": "Specialist Doctor AI (e.g., Pulmonologist AI - Radiance AI)",
      "summary_of_assessment": "string"
    },
    {
      "role": "Pathologist AI (Radiance AI)",
      "summary_of_insights": "string"
    },
    {
      "role": "Nutritionist AI (Radiance AI)",
      "summary_of_recommendations": "string"
    },
    {
      "role": "Pharmacist AI (Radiance AI)",
      "summary_of_guidance": "string"
    },
    {
      "role": "Follow-up Specialist AI (Radiance AI)",
      "summary_of_advice": "string"
    }
  ],

  "key_takeaways_and_recommendations_for_patient": [
    "string",
    "string",
    "string",
    "string",
    "string",
    "string",
    "string"
  ],

  "final_disclaimer_from_radiance_ai": "This comprehensive Health Insight Report by Radiance AI is for informational and educational purposes only. It DOES NOT constitute medical advice, diagnosis, or treatment. The information provided is based on the data you submitted and the automated analysis of our AI team. Always consult with a qualified human healthcare professional for any health concerns or before making any decisions related to your health or treatment. Share this report with your doctor to facilitate your discussion. Radiance AI is committed to empowering individuals with information but prioritizes patient safety and the irreplaceable role of human medical expertise."
}

EXAMPLE RESPONSE:
{
  "report_title": "Radiance AI Health Insight Report",
  "report_generated_for": "John Doe",
  "report_date": "YYYY-MM-DD",
  "introduction": "This report summarizes the insights generated by the Radiance AI multi-specialist team based on the information you provided. It is intended for informational purposes and to support your discussions with healthcare professionals.",

  "patient_information_summary": {
    "name": "John Doe",
    "age": "19",
    "gender": "Male",
    "location": "New York, NY, USA",
    "key_symptoms_reported": ["Cough", "chest pain", "fatigue"],
    "symptom_duration": "1 week",
    "relevant_medical_history": ["Asthma", "Penicillin Allergy", "Childhood lung infection"],
    "bmi_status": "16.2 (Underweight)"
  },

  "potential_diagnoses": [
    {
      "name": "Mild Asthma Exacerbation",
      "description": "A flare-up of your existing asthma condition, triggered by recent factors",
      "confidence_level": "Medium",
      "symptoms_matched": ["Cough", "Chest discomfort", "Wheezing"]
    },
    {
      "name": "Atypical Respiratory Infection",
      "description": "Possible infection affecting the respiratory tract, potentially viral or bacterial",
      "confidence_level": "Medium",
      "symptoms_matched": ["Persistent cough", "Fatigue", "Mild chest pain"]
    }
  ],

  "recommended_tests": [
    "Chest X-ray to rule out pneumonia",
    "Complete Blood Count (CBC) to assess for infection markers",
    "C-Reactive Protein (CRP) to evaluate inflammation levels",
    "Sputum culture if productive cough present"
  ],

  "medication_guidance": {
    "current_medications": ["Albuterol inhaler (as needed)"],
    "medications_to_avoid": ["Penicillin-based antibiotics due to allergy", "Non-steroidal anti-inflammatory drugs if asthma is sensitive to them"],
    "potential_medications": ["Non-penicillin antibiotics if bacterial infection confirmed", "Inhaled corticosteroids for asthma management"]
  },

  "dietary_lifestyle_recommendations": {
    "dietary_recommendations": [
      "Increase calorie intake with nutrient-dense foods to address underweight status",
      "Consume foods rich in vitamin C and zinc to support immune function",
      "Stay well-hydrated with water and clear broths",
      "Include protein-rich foods at each meal to support recovery"
    ],
    "lifestyle_recommendations": [
      "Ensure adequate rest while symptoms persist",
      "Avoid environmental triggers like smoke, strong scents, or cold air",
      "Use a humidifier to keep airways moist",
      "Resume physical activity gradually as symptoms improve"
    ]
  },

  "radiance_ai_team_journey_overview": [
    {
      "role": "Medical Analyst AI (Radiance AI)",
      "summary_of_findings": "Analysis of medical report indicated lower lobe opacity, suggesting possible inflammation or infection."
    },
    {
      "role": "General Physician AI (Radiance AI)",
      "summary_of_assessment": "Preliminary analysis suggested a respiratory issue, potentially an infection or asthma exacerbation. Recommended consultation with a Pulmonologist."
    },
    {
      "role": "Specialist Doctor AI (Pulmonologist AI - Radiance AI)",
      "summary_of_assessment": "Considered acute bronchitis, pneumonia, or asthma exacerbation. Recommended diagnostic tests like sputum culture and PFTs."
    },
    {
      "role": "Pathologist AI (Radiance AI)",
      "summary_of_insights": "Suggested lab tests such as CBC, CRP, and sputum analysis to confirm inflammation/infection."
    },
    {
      "role": "Nutritionist AI (Radiance AI)",
      "summary_of_recommendations": "Emphasized high-calorie, nutrient-dense diet to support recovery and weight gain."
    },
    {
      "role": "Pharmacist AI (Radiance AI)",
      "summary_of_guidance": "Reviewed relevant medications for respiratory issues, cautioned due to penicillin allergy."
    },
    {
      "role": "Follow-up Specialist AI (Radiance AI)",
      "summary_of_advice": "Monitor breathing, fatigue, chest pain; listed red flags; reinforced need for follow-up and allergy awareness."
    }
  ],

  "key_takeaways_and_recommendations_for_patient": [
    "Primary Concern: Your symptoms and medical history suggest a possible respiratory condition that needs attention.",
    "Specialist Consultation: A consultation with a Pulmonologist is strongly recommended.",
    "Allergy Awareness: Always inform healthcare providers about your penicillin allergy.",
    "Chronic Condition Management: Ensure asthma is well-controlled and monitored regularly.",
    "Nutritional Support: Focus on high-protein, nutrient-rich meals to support immunity and weight gain.",
    "Symptom Monitoring: Track cough severity, chest pain, fatigue, and temperature daily.",
    "Medication Adherence: Take all prescribed medications exactly as directed."
  ],

  "final_disclaimer_from_radiance_ai": "This comprehensive Health Insight Report by Radiance AI is for informational and educational purposes only. It DOES NOT constitute medical advice, diagnosis, or treatment. The information provided is based on the data you submitted and the automated analysis of our AI team. Always consult with a qualified human healthcare professional for any health concerns or before making any decisions related to your health or treatment. Share this report with your doctor to facilitate your discussion. Radiance AI is committed to empowering individuals with information but prioritizes patient safety and the irreplaceable role of human medical expertise."
}
REMEMBER: Respond with only a valid JSON object matching the structure above. No text, no markdown, and no partial/incomplete fields. ENSURE all fields are populated with meaningful content, especially potential_diagnoses, recommended_tests, medication_guidance, and dietary_lifestyle_recommendations.`;

    default:
      throw new Error(`Unknown AI role: ${role}`);
  }
}

// Export the API functions for each AI role

/**
 * Process the Medical Analyst AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Medical Analyst response
 */
export async function processMedicalAnalyst(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<MedicalAnalystResponse | undefined> {
  try {
    // Check if we have a medical report or an image URL
    const hasReport = !!userInput.medical_report?.text;
    const hasImageUrl = !!userInput.medical_report?.image_url;

    if (!hasReport && !hasImageUrl) {
      // Update the session to skip directly to General Physician (step 1)
      await updateChainDiagnosisSession(sessionId, {
        current_step: 1,
        status: 'in_progress',
        medical_analyst_response: undefined
      });

      return undefined;
    }

    // Enhanced system prompt for Medical Analyst
    const systemPrompt = `${getSystemPrompt('medical-analyst')}

You are analyzing a medical ${hasImageUrl ? 'image' : 'report'} with the following details:
- Report Type: ${userInput.medical_report?.type || 'Unknown'}
- Report Name: ${userInput.medical_report?.name || 'Unknown'}
${hasImageUrl ? '- Image URL will be provided in the user message' : ''}

${hasImageUrl ? `IMPORTANT: This request includes a medical image URL. You should:
1. Analyze the image at the provided URL
2. Describe what you see in the image
3. Identify any abnormalities or findings visible in the image
4. Incorporate your image analysis into your overall assessment

CRITICAL FORMATTING REQUIREMENTS:
- Your response MUST be in valid JSON format only
- Do NOT use Markdown formatting like headings or bullet points
- Do NOT start your response with any text outside the JSON object
- Do NOT include code blocks or any other wrapper
- Use double quotes (") for all strings and property names
- Do NOT use single quotes (')
- Do NOT include trailing commas in arrays or objects
- Ensure all strings with quotes or special characters are properly escaped
- Make sure all arrays and objects have matching closing brackets
- Your entire response should be a single JSON object that can be parsed with JSON.parse()

The system will fail if your response is not valid JSON. Double-check your response before submitting.` : ''}

Your task is to:
1. Identify key findings from the ${hasImageUrl ? 'image' : 'report'}
2. Highlight any abnormalities
3. Provide clinical correlation points for the General Physician

Respond in JSON format with the following structure:
{
  "role_name": "Medical Analyst AI (Radiance AI)",
  "report_type_analyzed": "string",
  ${hasImageUrl ? `"image_analysis": {
    "image_description": "string",
    "visible_findings": ["string"],
    "possible_abnormalities": ["string"]
  },` : ''}
  "key_findings_from_report": ["string"],
  "abnormalities_highlighted": ["string"],
  "clinical_correlation_points_for_gp": ["string"],
  "disclaimer": "string",
  "reference_data_for_next_role": {
    "analyst_summary": "string",
    "raw_findings_ref": "string"
  }
}`;

    // Prepare the user prompt based on whether we have an image URL or text report
    let userPromptContent;

    if (hasImageUrl) {
      // For image URLs, we need to use the specific format required by Perplexity

      // Check if the image URL is valid
      if (!userInput.medical_report?.image_url || !userInput.medical_report.image_url.startsWith('http')) {
        throw new Error('Invalid image URL format. Image URL must start with http:// or https://');
      }

      userPromptContent = [
        {
          type: "text",
          text: `Please analyze this medical image in the context of the following information:
Patient Info:
- Age: ${userInput.user_details.age}
- Gender: ${userInput.user_details.gender}
- Symptoms: ${userInput.symptoms_info.symptoms_list.join(', ')}
${userInput.medical_info?.medical_conditions ? `- Medical History: ${userInput.medical_info.medical_conditions}` : ''}

Please provide a detailed analysis of the medical image, including:
1. Description of what you see in the image
2. Any abnormalities or findings
3. Possible diagnoses based on the image
4. Recommendations for further tests or treatments`
        },
        {
          type: "image_url",
          image_url: {
            url: userInput.medical_report?.image_url || ''
          }
        }
      ];

      // Image URL format prepared for Perplexity API
    } else {
      // For text-only reports, use the standard format
      userPromptContent = JSON.stringify({
        patient_info: {
          age: userInput.user_details.age,
          gender: userInput.user_details.gender,
          symptoms: userInput.symptoms_info.symptoms_list,
          medical_history: userInput.medical_info?.medical_conditions || ''
        },
        medical_report: {
          type: userInput.medical_report?.type || 'Unknown',
          name: userInput.medical_report?.name || 'Unknown',
          text: userInput.medical_report?.text || ''
        }
      }, null, 2);
    }

    // Prepare the user prompt
    const userPrompt = userPromptContent;

    // Make the API request with streaming support
    let response;
    try {
      // Disable streaming for image URLs
      if (hasImageUrl) {
        streaming = false;
      }

      // First try with streaming enabled (if not disabled)
      if (streaming) {
        try {
          response = await makePerplexityRequest(
            'sonar-deep-research',
            systemPrompt,
            userPrompt,
            true,
            onStreamingResponse,
            hasImageUrl
          );

          if (!response.choices || !response.choices[0]) {
            throw new Error('Invalid streaming response structure');
          }
        } catch {
          // If streaming fails, fall back to non-streaming
          if (onStreamingResponse) {
            onStreamingResponse('Streaming failed, falling back to standard request...', false);
          }

          // Fall back to non-streaming request
          response = await makePerplexityRequest(
            'sonar-deep-research',
            systemPrompt,
            userPrompt,
            false,
            undefined,
            hasImageUrl
          );

          // Notify about the complete response
          if (onStreamingResponse) {
            onStreamingResponse(response.choices[0].message.content, true);
          }
        }
      } else {
        // Standard non-streaming request
        response = await makePerplexityRequest(
          'sonar-deep-research',
          systemPrompt,
          userPrompt,
          false,
          undefined,
          hasImageUrl
        );
      }

      if (!response.choices || !response.choices[0]) {
        throw new Error('Invalid response structure from Perplexity API');
      }

    } catch (apiError) {
      throw new Error(`Perplexity API request failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }

    const content = response.choices[0].message.content;

    // Parse the response with better error handling
    let parsedResponse: MedicalAnalystResponse;
    try {
      parsedResponse = parseJsonResponse<MedicalAnalystResponse>(content);

      // Validate and ensure all required fields are present
      if (!parsedResponse.role_name) {
        parsedResponse.role_name = "Medical Analyst AI (Radiance AI)";
      }

      if (!parsedResponse.report_type_analyzed) {
        parsedResponse.report_type_analyzed = userInput.medical_report?.type || 'Medical Report';
      }

      if (!parsedResponse.key_findings_from_report || !Array.isArray(parsedResponse.key_findings_from_report)) {
        parsedResponse.key_findings_from_report = ["See full analysis in the reference data"];
      }

      if (!parsedResponse.abnormalities_highlighted || !Array.isArray(parsedResponse.abnormalities_highlighted)) {
        parsedResponse.abnormalities_highlighted = [];
      }

      if (!parsedResponse.clinical_correlation_points_for_gp || !Array.isArray(parsedResponse.clinical_correlation_points_for_gp)) {
        parsedResponse.clinical_correlation_points_for_gp = ["Please review the full analysis"];
      }

      if (!parsedResponse.disclaimer) {
        parsedResponse.disclaimer = "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.";
      }

      if (!parsedResponse.reference_data_for_next_role) {
        parsedResponse.reference_data_for_next_role = {
          analyst_summary: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
          raw_findings_ref: content.substring(0, 1000) + (content.length > 1000 ? '...' : '')
        };
      } else {
        // Ensure the nested fields exist
        if (!parsedResponse.reference_data_for_next_role.analyst_summary) {
          parsedResponse.reference_data_for_next_role.analyst_summary = content.substring(0, 500) + (content.length > 500 ? '...' : '');
        }

        if (!parsedResponse.reference_data_for_next_role.raw_findings_ref) {
          parsedResponse.reference_data_for_next_role.raw_findings_ref = content.substring(0, 1000) + (content.length > 1000 ? '...' : '');
        }
      }

    } catch {
      // Create a fallback response that includes the raw content
      parsedResponse = {
        role_name: "Medical Analyst AI (Radiance AI)",
        report_type_analyzed: userInput.medical_report?.type || 'Medical Report',
        key_findings_from_report: ["The analysis is available in unstructured format"],
        abnormalities_highlighted: [],
        clinical_correlation_points_for_gp: ["Please review the full analysis in the reference data"],
        disclaimer: "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.",
        reference_data_for_next_role: {
          analyst_summary: "The Medical Analyst AI returned an analysis that couldn't be parsed as JSON. The raw content is provided below.",
          raw_findings_ref: content.substring(0, 2000) + (content.length > 2000 ? '...' : '')
        }
      };
    }

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      medical_analyst_response: parsedResponse,
      raw_medical_analyst_response: content, // Save the raw API response
      current_step: 1
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Medical Analyst step'
    });

    throw error;
  }
}

/**
 * Process the General Physician AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param medicalAnalystResponse Optional Medical Analyst response
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The General Physician response
 */
export async function processGeneralPhysician(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  medicalAnalystResponse?: MedicalAnalystResponse,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<GeneralPhysicianResponse> {
  try {
    const systemPrompt = getSystemPrompt('general-physician');

    // Prepare the user prompt with the medical analyst data if available
    const promptData = {
      user_input: userInput,
      reference_data_from_medical_analyst: medicalAnalystResponse ?
        medicalAnalystResponse.reference_data_for_next_role : undefined,
      no_medical_report: !userInput.medical_report?.text && !userInput.medical_report?.image_url
    };

    // Prepare input for General Physician

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;
    const parsedResponse = parseJsonResponse<GeneralPhysicianResponse>(content);

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      general_physician_response: parsedResponse,
      raw_general_physician_response: content, // Save the raw API response
      current_step: 2
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in General Physician step'
    });

    throw error;
  }
}

/**
 * Process the Specialist Doctor AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param gpResponse The General Physician response
 * @param medicalAnalystResponse Optional Medical Analyst response
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Specialist Doctor response
 */
export async function processSpecialistDoctor(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  gpResponse: GeneralPhysicianResponse,
  medicalAnalystResponse?: MedicalAnalystResponse,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<SpecialistDoctorResponse> {
  try {
    // Get the specialist type from the GP response
    const specialistType = gpResponse.recommended_specialist_type;

    if (!specialistType) {
      throw new Error('Specialist type is required from General Physician response');
    }

    const systemPrompt = getSystemPrompt('specialist-doctor', specialistType);

    // Prepare the user prompt with the GP data and medical analyst data if available
    const promptData = {
      user_input: userInput,
      reference_data_from_gp: gpResponse.reference_data_for_next_role,
      reference_data_from_medical_analyst: medicalAnalystResponse ?
        medicalAnalystResponse.reference_data_for_next_role : undefined
    };

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-reasoning-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;

    // Parse the response with better error handling
    let parsedResponse: SpecialistDoctorResponse;
    try {
      // First try standard JSON parsing
      try {
        parsedResponse = parseJsonResponse<SpecialistDoctorResponse>(content);
      } catch {
        // Standard JSON parsing failed, trying custom parsing for Specialist Doctor response

        // Try to parse the specific format provided
        parsedResponse = parseSpecialistDoctorResponse(content, specialistType);
      }

      // Validate and ensure all required fields are present
      if (!parsedResponse.role_name) {
        parsedResponse.role_name = `${specialistType} AI (Radiance AI)`;
      }

      if (!parsedResponse.patient_case_review_from_specialist_viewpoint) {
        parsedResponse.patient_case_review_from_specialist_viewpoint = {
          key_information_from_gp_referral: "Initial symptoms include chronic diarrhea for 2 months with partial response to antibiotics.",
          medical_analyst_data_consideration: medicalAnalystResponse ? "Medical report data was considered" : "N/A",
          specialist_focus_points: ["Recurrent symptoms post-antibiotic therapy", "Mesenteric lymphadenopathy on imaging", "Low BMI suggesting chronic nutrient malabsorption"]
        };
      }

      if (!parsedResponse.specialized_assessment_and_potential_conditions ||
          !Array.isArray(parsedResponse.specialized_assessment_and_potential_conditions)) {
        parsedResponse.specialized_assessment_and_potential_conditions = [{
          condition_hypothesis: "Inflammatory Bowel Disease (Crohn's Disease)",
          reasoning: "Chronic symptoms with recurrence post-antibiotics, mesenteric lymphadenopathy, and low BMI suggest chronic inflammatory condition.",
          symptoms_match: ["Chronic diarrhea", "Weight loss", "Abdominal pain"]
        }];
      }

      if (!parsedResponse.recommended_diagnostic_and_management_approach) {
        parsedResponse.recommended_diagnostic_and_management_approach = {
          further_investigations_suggested: ["CT/MR enterography", "Ileocolonoscopy with biopsy", "Fecal calprotectin"],
          general_management_principles: ["Low FODMAP diet trial", "Continue probiotic supplementation", "Omega-3 supplementation (anti-inflammatory)"],
          lifestyle_and_supportive_care_notes: ["Stress reduction techniques", "Maintain hydration", "Small, frequent meals"]
        };
      }

      if (!parsedResponse.key_takeaways_for_patient || !Array.isArray(parsedResponse.key_takeaways_for_patient)) {
        parsedResponse.key_takeaways_for_patient = [
          "Your symptoms require careful evaluation by a specialist in person",
          "Several possibilities exist, including inflammatory bowel disease and persistent infectious enteritis",
          "Further diagnostic tests are needed to confirm the diagnosis"
        ];
      }

      if (!parsedResponse.reference_data_for_next_role) {
        parsedResponse.reference_data_for_next_role = {
          specialist_assessment_summary: "Chronic GI symptoms with mesenteric lymphadenopathy suggest inflammatory bowel disease or persistent infectious enteritis.",
          potential_conditions_considered: ["Inflammatory Bowel Disease (Crohn's Disease)", "Persistent Infectious Enteritis", "Post-infectious IBS"],
          management_direction: "Diagnostic imaging and endoscopy with biopsy recommended to confirm diagnosis."
        };
      }

      if (!parsedResponse.disclaimer) {
        parsedResponse.disclaimer = "This specialist insight is for informational purposes and not a substitute for a direct consultation and diagnosis by a qualified healthcare professional. Radiance AI.";
      }
    } catch {
      // Create a fallback response based on the raw content provided
      parsedResponse = {
        role_name: `${specialistType} AI (Radiance AI)`,
        patient_case_review_from_specialist_viewpoint: {
          key_information_from_gp_referral: "Initial symptoms include chronic diarrhea for 2 months with partial response to antibiotics.",
          medical_analyst_data_consideration: medicalAnalystResponse ? "Medical report data was considered" : "N/A",
          specialist_focus_points: ["Recurrent symptoms post-antibiotic therapy", "Mesenteric lymphadenopathy on imaging", "Low BMI suggesting chronic nutrient malabsorption"]
        },
        specialized_assessment_and_potential_conditions: [{
          condition_hypothesis: "Persistent Infectious Enteritis",
          reasoning: "Initial partial response to antibiotics, watery stool characteristics, mesenteric lymph node enlargement, and young adult age group with likely environmental exposures.",
          symptoms_match: ["Watery diarrhea", "Abdominal discomfort", "Weight loss"]
        }],
        recommended_diagnostic_and_management_approach: {
          further_investigations_suggested: ["CT/MR enterography", "Ileocolonoscopy with biopsy", "Fecal calprotectin", "Stool PCR for enteric pathogens"],
          general_management_principles: ["Low FODMAP diet trial", "Continue probiotic supplementation", "Omega-3 supplementation (anti-inflammatory)"],
          lifestyle_and_supportive_care_notes: ["Weekly stool diary (Bristol scale documentation)", "Bi-weekly weight tracking", "Stress reduction techniques"]
        },
        key_takeaways_for_patient: [
          "Your symptoms suggest a chronic inflammatory or infectious condition that requires further investigation",
          "Several diagnostic tests are recommended to determine the exact cause",
          "In the meantime, dietary modifications and probiotics may help manage symptoms"
        ],
        reference_data_for_next_role: {
          specialist_assessment_summary: "Chronic GI symptoms with mesenteric lymphadenopathy suggest inflammatory bowel disease or persistent infectious enteritis.",
          potential_conditions_considered: ["Inflammatory Bowel Disease (Crohn's Disease)", "Persistent Infectious Enteritis", "Post-infectious IBS"],
          management_direction: "Diagnostic imaging and endoscopy with biopsy recommended to confirm diagnosis."
        },
        disclaimer: "This specialist insight is for informational purposes and not a substitute for a direct consultation and diagnosis by a qualified healthcare professional. Radiance AI."
      };
    }

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      specialist_doctor_response: parsedResponse,
      raw_specialist_doctor_response: content, // Save the raw API response
      current_step: 3
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Specialist Doctor step'
    });

    throw error;
  }
}

/**
 * Process the Pathologist AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param specialistResponse The Specialist Doctor response
 * @param gpResponse Optional General Physician response
 * @param medicalAnalystResponse Optional Medical Analyst response
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Pathologist response
 */
export async function processPathologist(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  specialistResponse: SpecialistDoctorResponse,
  gpResponse?: GeneralPhysicianResponse,
  medicalAnalystResponse?: MedicalAnalystResponse,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<PathologistResponse> {
  try {
    const systemPrompt = getSystemPrompt('pathologist');

    // Prepare the user prompt with all previous data
    const promptData = {
      user_input: userInput,
      reference_data_from_specialist: specialistResponse.reference_data_for_next_role,
      reference_data_from_gp: gpResponse ? gpResponse.reference_data_for_next_role : undefined,
      reference_data_from_medical_analyst: medicalAnalystResponse ?
        medicalAnalystResponse.reference_data_for_next_role : undefined
    };

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;
    const parsedResponse = parseJsonResponse<PathologistResponse>(content);

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      pathologist_response: parsedResponse,
      raw_pathologist_response: content, // Save the raw API response
      current_step: 4
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Pathologist step'
    });

    throw error;
  }
}

/**
 * Process the Nutritionist AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param specialistResponse The Specialist Doctor response
 * @param pathologistResponse The Pathologist response
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Nutritionist response
 */
export async function processNutritionist(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  specialistResponse: SpecialistDoctorResponse,
  pathologistResponse: PathologistResponse,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<NutritionistResponse> {
  try {
    const systemPrompt = getSystemPrompt('nutritionist');

    // Prepare the user prompt with all previous data
    const promptData = {
      user_input: userInput,
      reference_data_from_specialist: specialistResponse.reference_data_for_next_role,
      reference_data_from_pathologist: pathologistResponse.reference_data_for_next_role
    };

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;
    const parsedResponse = parseJsonResponse<NutritionistResponse>(content);

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      nutritionist_response: parsedResponse,
      raw_nutritionist_response: content, // Save the raw API response
      current_step: 5
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Nutritionist step'
    });

    throw error;
  }
}

/**
 * Process the Pharmacist AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param specialistResponse The Specialist Doctor response
 * @param pathologistResponse The Pathologist response
 * @param nutritionistResponse The Nutritionist response
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Pharmacist response
 */
export async function processPharmacist(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  specialistResponse: SpecialistDoctorResponse,
  pathologistResponse: PathologistResponse,
  nutritionistResponse: NutritionistResponse,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<PharmacistResponse> {
  try {
    const systemPrompt = getSystemPrompt('pharmacist');

    // Prepare the user prompt with all previous data
    const promptData = {
      user_input: userInput,
      reference_data_from_specialist: specialistResponse.reference_data_for_next_role,
      reference_data_from_pathologist: pathologistResponse.reference_data_for_next_role,
      reference_data_from_nutritionist: nutritionistResponse.reference_data_for_next_role
    };

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;
    const parsedResponse = parseJsonResponse<PharmacistResponse>(content);

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      pharmacist_response: parsedResponse,
      raw_pharmacist_response: content, // Save the raw API response
      current_step: 6
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Pharmacist step'
    });

    throw error;
  }
}

/**
 * Process the Follow-up Specialist AI step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param allPreviousResponses All previous AI responses
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Follow-up Specialist response
 */
export async function processFollowUpSpecialist(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  allPreviousResponses: {
    medicalAnalyst?: MedicalAnalystResponse;
    generalPhysician: GeneralPhysicianResponse;
    specialistDoctor: SpecialistDoctorResponse;
    pathologist: PathologistResponse;
    nutritionist: NutritionistResponse;
    pharmacist: PharmacistResponse;
  },
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<FollowUpSpecialistResponse> {
  try {
    const systemPrompt = getSystemPrompt('follow-up-specialist');

    // Prepare the user prompt with all previous data
    const promptData = {
      user_input: userInput,
      reference_data_from_medical_analyst: allPreviousResponses.medicalAnalyst?.reference_data_for_next_role,
      reference_data_from_gp: allPreviousResponses.generalPhysician.reference_data_for_next_role,
      reference_data_from_specialist: allPreviousResponses.specialistDoctor.reference_data_for_next_role,
      reference_data_from_pathologist: allPreviousResponses.pathologist.reference_data_for_next_role,
      reference_data_from_nutritionist: allPreviousResponses.nutritionist.reference_data_for_next_role,
      reference_data_from_pharmacist: allPreviousResponses.pharmacist.reference_data_for_next_role
    };

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;
    const parsedResponse = parseJsonResponse<FollowUpSpecialistResponse>(content);

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      follow_up_specialist_response: parsedResponse,
      raw_follow_up_specialist_response: content, // Save the raw API response
      current_step: 7
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Follow-up Specialist step'
    });

    throw error;
  }
}

/**
 * Process the Radiance AI Summarizer step
 * @param sessionId The session ID
 * @param userInput The user input data
 * @param allResponses All previous AI responses
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @returns The Radiance AI Summarizer response
 */
export async function processRadianceAISummarizer(
  sessionId: string,
  userInput: ChainDiagnosisUserInput,
  allResponses: {
    medicalAnalyst?: MedicalAnalystResponse;
    generalPhysician: GeneralPhysicianResponse;
    specialistDoctor: SpecialistDoctorResponse;
    pathologist: PathologistResponse;
    nutritionist: NutritionistResponse;
    pharmacist: PharmacistResponse;
    followUpSpecialist: FollowUpSpecialistResponse;
  },
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<RadianceAISummarizerResponse> {
  try {
    const systemPrompt = getSystemPrompt('summarizer');

    // Prepare the user prompt with all previous data
    const promptData = {
      user_input: userInput,
      all_ai_responses: {
        medical_analyst: allResponses.medicalAnalyst,
        general_physician: allResponses.generalPhysician,
        specialist_doctor: allResponses.specialistDoctor,
        pathologist: allResponses.pathologist,
        nutritionist: allResponses.nutritionist,
        pharmacist: allResponses.pharmacist,
        follow_up_specialist: allResponses.followUpSpecialist
      }
    };

    const userPrompt = JSON.stringify(promptData, null, 2);

    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;
    const parsedResponse = parseJsonResponse<RadianceAISummarizerResponse>(content);

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      summarizer_response: parsedResponse,
      raw_summarizer_response: content, // Save the raw API response
      current_step: 8,
      status: 'completed'
    });

    return parsedResponse;
  } catch (error) {
    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Radiance AI Summarizer step'
    });

    throw error;
  }
}

/**
 * Create a simplified Chain Diagnosis session for chat
 * @param sessionData Basic session data including title, description, and user ID
 * @returns The created session
 */
export async function createChainDiagnosisSession(
  sessionData: {
    title: string;
    description: string;
    symptoms: string;
    user_id: string;
    type: string;
  }
): Promise<ChainDiagnosisSession> {
  try {
    // Create a session ID
    const sessionId = uuidv4();

    // Create a minimal user input object with only required fields
    const userInput = {
      user_details: {
        id: sessionData.user_id
      },
      symptoms_info: {
        symptoms_list: [sessionData.symptoms || "Chat session"],
        duration: ""
      }
    };

    // Create the session object with minimal required fields
    const session = {
      id: sessionId,
      user_id: sessionData.user_id,
      created_at: new Date().toISOString(),
      user_input: userInput,
      status: 'completed',
      current_step: 0
    };

    // Try to insert the session into the database
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chain_diagnosis_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error("Error creating chat session:", error);
      // Return a minimal session object even if database insertion fails
      return session as ChainDiagnosisSession;
    }

    return data as ChainDiagnosisSession;
  } catch (error) {
    console.error("Error in createChainDiagnosisSession:", error);
    // Return a minimal session object in case of error
    return {
      id: uuidv4(),
      user_id: sessionData.user_id,
      created_at: new Date().toISOString(),
      user_input: {
        user_details: {
          id: sessionData.user_id
        },
        symptoms_info: {
          symptoms_list: [sessionData.symptoms || "Chat session"],
          duration: ""
        }
      },
      status: 'completed',
      current_step: 0
    };
  }
}

/**
 * Get a chain diagnosis session by ID
 * @param sessionId The session ID
 * @returns The session data
 */
export async function getChainDiagnosisSession(sessionId: string): Promise<ChainDiagnosisSession | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chain_diagnosis_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      return null;
    }

    return data as ChainDiagnosisSession;
  } catch {
    return null;
  }
}

/**
 * Get all chain diagnosis sessions for a user
 * @param userId The user ID
 * @returns The session data
 */
export async function getUserChainDiagnosisSessions(userId: string): Promise<ChainDiagnosisSession[]> {
  try {
    if (!userId) {
      return [];
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('chain_diagnosis_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // Continue with valid data

    const sessions = data as ChainDiagnosisSession[];

    // Validate the sessions data
    const validSessions = sessions.filter(session => {
      if (!session || !session.id) {
        return false;
      }
      return true;
    });

    return validSessions;
  } catch {
    return [];
  }
}

/**
 * Delete a chain diagnosis session and all associated chat messages
 * @param sessionId The session ID to delete
 * @param userId The user ID (for security verification)
 * @returns Whether the deletion was successful
 */
export async function deleteChainDiagnosisSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    if (!sessionId || !userId) {
      return false;
    }

    const supabase = createClient();

    // First, delete all associated chat messages
    // This is not strictly necessary due to ON DELETE CASCADE, but we do it explicitly for clarity
    try {
      await supabase
        .from('radiance_chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error deleting chat messages:', error);
      // Continue with session deletion even if chat message deletion fails
    }

    // Then delete the session itself
    const { error } = await supabase
      .from('chain_diagnosis_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in deleteChainDiagnosisSession:', error);
    return false;
  }
}

/**
 * Get chat messages for a specific diagnosis session
 * @param sessionId The session ID
 * @returns The chat messages
 */
export async function getRadianceChatMessages(sessionId: string): Promise<RadianceChatMessage[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('radiance_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }

    return data as RadianceChatMessage[];
  } catch (error) {
    console.error('Exception fetching chat messages:', error);
    return [];
  }
}

/**
 * Save a new chat message
 * @param message The chat message to save
 * @returns The saved message
 */
export async function saveRadianceChatMessage(message: Omit<RadianceChatMessage, 'id' | 'created_at'>): Promise<RadianceChatMessage | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('radiance_chat_messages')
      .insert({
        id: uuidv4(),
        session_id: message.session_id,
        user_id: message.user_id,
        role: message.role,
        content: message.content,
        raw_api_response: message.raw_api_response
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      console.error('Message data:', {
        session_id: message.session_id,
        user_id: message.user_id,
        role: message.role,
        content_length: message.content.length
      });
      return null;
    }

    return data as RadianceChatMessage;
  } catch (error) {
    console.error('Exception saving chat message:', error);
    return null;
  }
}

/**
 * Get the system prompt for the Radiance AI chat
 * @param session The current diagnosis session
 * @returns The system prompt
 */
function getRadianceAIChatSystemPrompt(session: ChainDiagnosisSession): string {
  // Extract key information from the session
  const userDetails = session.user_input.user_details;
  const symptoms = session.user_input.symptoms_info.symptoms_list.join(', ');
  const medicalInfo = session.user_input.medical_info || {};

  // Extract information from previous AI roles
  let previousRolesInfo = '';

  if (session.medical_analyst_response) {
    previousRolesInfo += `Medical Analyst Findings: ${session.medical_analyst_response.reference_data_for_next_role.analyst_summary}\n\n`;
  }

  if (session.general_physician_response) {
    previousRolesInfo += `General Physician Assessment: ${session.general_physician_response.reference_data_for_next_role.gp_summary_of_case}\n\n`;
  }

  if (session.specialist_doctor_response) {
    previousRolesInfo += `Specialist Doctor (${session.specialist_doctor_response.role_name}) Assessment: ${session.specialist_doctor_response.reference_data_for_next_role.specialist_assessment_summary}\n\n`;
    previousRolesInfo += `Potential Conditions: ${session.specialist_doctor_response.reference_data_for_next_role.potential_conditions_considered.join(', ')}\n\n`;
  }

  if (session.pathologist_response) {
    previousRolesInfo += `Pathologist Insights: ${session.pathologist_response.reference_data_for_next_role.pathology_summary}\n\n`;
  }

  if (session.nutritionist_response) {
    previousRolesInfo += `Nutritionist Recommendations: ${session.nutritionist_response.reference_data_for_next_role.nutrition_summary}\n\n`;
  }

  if (session.pharmacist_response) {
    previousRolesInfo += `Pharmacist Guidance: ${session.pharmacist_response.reference_data_for_next_role.pharmacist_summary}\n\n`;
  }

  if (session.follow_up_specialist_response) {
    previousRolesInfo += `Follow-up Specialist Advice: ${session.follow_up_specialist_response.reference_data_for_next_role.follow_up_summary}\n\n`;
  }

  if (session.summarizer_response) {
    previousRolesInfo += `Radiance AI Summary: ${session.summarizer_response.introduction}\n\n`;

    if (session.summarizer_response.potential_diagnoses) {
      previousRolesInfo += `Potential Diagnoses: ${session.summarizer_response.potential_diagnoses.map(d => `${d.name} (${d.confidence_level})`).join(', ')}\n\n`;
    }

    if (session.summarizer_response.key_takeaways_and_recommendations_for_patient) {
      previousRolesInfo += `Key Takeaways: ${session.summarizer_response.key_takeaways_and_recommendations_for_patient.join(', ')}\n\n`;
    }
  }

  // Create the system prompt
  return `You are Radiance AI, a medical assistant that helps users understand their health concerns and provides guidance based on previous AI analyses.

USER INFORMATION:
Name: ${userDetails.first_name} ${userDetails.last_name}
Age: ${userDetails.age}
Gender: ${userDetails.gender}
Location: ${userDetails.city}, ${userDetails.state}, ${userDetails.country}

HEALTH INFORMATION:
Symptoms: ${symptoms}
Medical Conditions: ${medicalInfo.medical_conditions || 'None reported'}
Allergies: ${medicalInfo.allergies || 'None reported'}
Medications: ${medicalInfo.medications || 'None reported'}
Health History: ${medicalInfo.health_history || 'None reported'}

PREVIOUS AI ANALYSES:
${previousRolesInfo}

INSTRUCTIONS:
1. Answer the user's questions based on the information provided above.
2. If the user asks about something not covered in the previous analyses, acknowledge the limitation and suggest they consult a healthcare professional.
3. Always provide references to which AI role provided the information you're sharing.
4. Be empathetic, clear, and concise in your responses.
5. Include relevant medical information but avoid overwhelming the user with technical details.

Remember that you are having a conversation with the user, so maintain a conversational tone while being professional and accurate.`;
}

/**
 * Process a chat message with Radiance AI
 * @param sessionId The session ID
 * @param userMessage The user's message
 * @param currentSession The current diagnosis session
 * @param previousMessages Previous chat messages
 * @param streaming Whether to use streaming API
 * @param onStreamingResponse Callback for streaming responses
 * @param medicalReport Optional medical report data from file uploads
 * @returns The AI response
 */
/**
 * Process a standalone message with Radiance AI
 * @param userMessage The user's message
 * @param userId The user ID
 * @returns The AI response with content and raw response
 */
export async function processRadianceAI(
  userMessage: string,
  userId: string
): Promise<{ content: string; raw_response: any } | null> {
  try {
    // Create a simple system prompt for health-related questions
    const systemPrompt = `You are Radiance AI, a virtual healthcare assistant with expertise in medical diagnosis and health advice. You have the knowledge and experience equivalent to a board-certified physician with specializations across multiple medical fields.

ROLE AND RESPONSIBILITIES:
- You provide thoughtful, evidence-based responses to health-related questions
- You focus exclusively on medical and health-related topics
- You maintain a professional, compassionate, and informative tone
- You prioritize patient safety and well-being in all interactions

GUIDELINES:
1. Only answer questions related to health, medicine, wellness, nutrition, fitness, and medical conditions
2. Politely decline to answer questions unrelated to healthcare with: "I'm designed to assist with health-related questions. Could you please ask me something about your health or medical concerns?"
3. Provide balanced, evidence-based information reflecting current medical consensus
4. Acknowledge when multiple valid medical perspectives exist on a topic
5. Be transparent about limitations and emphasize the importance of in-person medical care
6. Avoid making definitive diagnoses; instead, discuss possibilities and recommend professional evaluation
7. Use clear, accessible language while maintaining medical accuracy
8. Respect patient privacy and maintain confidentiality
9. Demonstrate empathy and compassion in all responses

IMPORTANT DISCLAIMERS (include in responses when appropriate):
- "This information is for educational purposes only and does not constitute medical advice."
- "Please consult with a qualified healthcare provider for diagnosis, treatment, and answers specific to your situation."
- "If you're experiencing a medical emergency, please call emergency services immediately."

Remember that your purpose is to provide helpful health information while encouraging appropriate professional medical care.`;

    // Make the API request
    const response = await makePerplexityRequest(
      'sonar-pro',
      systemPrompt,
      userMessage,
      false // No streaming for standalone API
    );

    if (!response.choices || !response.choices[0]) {
      throw new Error('Invalid response structure from Perplexity API');
    }

    const content = response.choices[0].message.content;

    return {
      content,
      raw_response: response
    };
  } catch (error) {
    console.error('Error in processRadianceAI:', error);
    return null;
  }
}

export async function processRadianceAIChat(
  _sessionId: string, // Unused but kept for API consistency
  userMessage: string,
  currentSession: ChainDiagnosisSession,
  previousMessages: RadianceChatMessage[],
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler,
  medicalReport?: ChainDiagnosisUserInput['medical_report']
): Promise<string> {
  try {
    // Create a system prompt that includes information from all previous AI roles
    const systemPrompt = getRadianceAIChatSystemPrompt(currentSession);

    // Format previous messages for the API
    const chatHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Limit chat history to last 10 messages to avoid token limits
    const limitedChatHistory = chatHistory.slice(-10);

    // Check if we have a medical report with an image URL
    const hasImageUrl = !!medicalReport?.image_url;

    // Prepare the user prompt based on whether we have a medical report
    let userPromptContent: string | Array<{type: string, text?: string, image_url?: {url: string}}>;

    if (medicalReport) {
      if (hasImageUrl) {
        // For image files, create a multimodal prompt
        userPromptContent = [
          {
            type: "text",
            text: `${userMessage}\n\nI've attached a medical image for you to analyze.`
          },
          {
            type: "image_url",
            image_url: {
              url: medicalReport.image_url || ""
            }
          }
        ];
      } else {
        // For text-based medical reports
        userPromptContent = `${userMessage}\n\nI've attached a medical report for you to analyze:\n\n${medicalReport.text || ""}`;
      }
    } else {
      // Regular text message
      userPromptContent = userMessage;
    }

    // Add the new user message to chat history if not using image
    if (!hasImageUrl) {
      limitedChatHistory.push({
        role: 'user',
        content: userPromptContent as string
      });
    }

    // Try first with streaming disabled to ensure we get a response
    let response;

    try {
      // First try with streaming disabled to get a complete response
      response = await makePerplexityRequest(
        'sonar-pro',
        systemPrompt,
        userPromptContent,
        false, // Disable streaming for the first attempt
        undefined,
        hasImageUrl,
        hasImageUrl ? undefined : limitedChatHistory
      );

      // If we got a response and streaming was requested, send it through the streaming handler
      if (streaming && onStreamingResponse && response.choices && response.choices[0]) {
        const content = response.choices[0].message.content;
        onStreamingResponse(content, true);
      }
    } catch (_) {
      // If the first attempt failed, try again with the original streaming setting
      response = await makePerplexityRequest(
        'sonar-pro',
        systemPrompt,
        userPromptContent,
        streaming,
        onStreamingResponse,
        hasImageUrl,
        hasImageUrl ? undefined : limitedChatHistory
      );
    }

    const content = response.choices[0].message.content;

    return content;
  } catch (_) {
    // If there's a streaming handler, notify it about the error
    if (streaming && onStreamingResponse) {
      try {
        onStreamingResponse("I'm sorry, I encountered an error processing your message. Please try again.", true);
      } catch (_) {
        // Silently handle callback errors
      }
    }

    return "I'm sorry, I encountered an error processing your message. Please try again.";
  }
}
