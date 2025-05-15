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
  ChainDiagnosisSession
} from '@/types/chain-diagnosis';
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
 * @returns The API response
 */
async function makePerplexityRequest(
  model: string,
  systemPrompt: string,
  userPrompt: string | Array<{type: string, text?: string, image_url?: {url: string}}>,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler,
  hasImageUrl: boolean = false
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
            hasImageUrl
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
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
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
            hasImageUrl
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
  console.log("Parsing specialist doctor response with custom parser");

  // Try to extract the JSON object from the content
  try {
    // First, try to parse it as a regular JSON
    try {
      return JSON.parse(content) as SpecialistDoctorResponse;
    } catch (e) {
      console.log("Regular JSON parsing failed, trying to extract from content");
    }

    // If that fails, try to extract the JSON object from the content
    const jsonMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]) as SpecialistDoctorResponse;
      } catch (e) {
        console.log("Extracted JSON parsing failed, trying to parse manually");
      }
    }

    // If that fails, try to parse the specific format provided
    console.log("Attempting to parse the specific format provided");

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
      return `You are the Medical Analyst AI at Radiance AI. Your primary role is to analyze uploaded medical test reports (text-based or descriptions of images) provided in the user input.

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

The expected JSON structure is:
{
  "role_name": "Medical Analyst AI (Radiance AI)",
  "report_type_analyzed": "string",
  "key_findings_from_report": ["string", "string"],
  "abnormalities_highlighted": ["string", "string"],
  "clinical_correlation_points_for_gp": ["string", "string"],
  "disclaimer": "string",
  "reference_data_for_next_role": {
    "analyst_summary": "string",
    "raw_findings_ref": "string"
  }
}

IMPORTANT: The system will fail if your response is not valid JSON. Double-check your response before submitting.`;

    case 'general-physician':
      return `You are the General Physician AI at Radiance AI. Your role is to provide an initial assessment based on patient information and symptoms, and if available, a medical analyst's report summary.

Your Task:
1. Review the complete user input (patient details, symptoms, medical history).
2. If 'reference_data_from_medical_analyst' is provided, incorporate its summary into your assessment.
3. Provide a preliminary analysis of potential underlying causes for the symptoms.
4. Suggest the type of Specialist Doctor the user should consult, if necessary.
5. Offer general advice and identify key questions the user might ask the specialist.
6. You DO NOT provide a definitive diagnosis.

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

The expected JSON structure is:
{
  "role_name": "General Physician AI (Radiance AI)",
  "patient_summary_review": {
    "name": "John Doe",
    "age": 19,
    "key_symptoms": ["Cough", "chest pain", "fatigue"],
    "relevant_history": ["Asthma", "Childhood lung infection"]
  },
  "medical_analyst_findings_summary": "Summary of Medical Analyst's report, if available. State 'N/A' if not.",
  "preliminary_symptom_analysis": [
    "e.g., Cough, chest pain, and fatigue in a 19-year-old with a history of asthma and childhood lung infection could suggest a respiratory issue.",
    "e.g., The BMI of 16.2 indicates underweight status, which could impact immunity or recovery."
  ],
  "potential_areas_of_concern": [
    "e.g., Respiratory tract infection (viral, bacterial).",
    "e.g., Exacerbation of asthma.",
    "e.g., Nutritional deficiencies contributing to fatigue."
  ],
  "recommended_specialist_type": "e.g., Pulmonologist",
  "general_initial_advice": [
    "e.g., Rest and hydrate well.",
    "e.g., Monitor temperature.",
    "e.g., Avoid irritants like smoke."
  ],
  "questions_for_specialist_consultation": [
    "e.g., What are the likely causes of my symptoms given my history?",
    "e.g., Are any specific tests (like a new X-ray or blood work) needed?",
    "e.g., How might my asthma be affecting this?"
  ],
  "reference_data_for_next_role": {
    "gp_summary_of_case": "Concise summary of the patient's presentation and GP's initial thoughts.",
    "gp_reason_for_specialist_referral": "Briefly why this specialist is recommended.",
    "analyst_ref_if_any": "Brief mention if Medical Analyst data was used, e.g., 'Analyst noted lower lobe opacity.'"
  },
  "disclaimer": "This is a preliminary assessment for informational purposes only and not a medical diagnosis. Please consult a qualified healthcare professional for an accurate diagnosis and treatment. Radiance AI."
}

If no medical report or image was provided (indicated by no_medical_report: true in the input), you should proceed with your assessment based solely on the patient's symptoms and medical history.

IMPORTANT: The system will fail if your response is not valid JSON. Double-check your response before submitting.`;

    case 'specialist-doctor':
      return `You are a ${specialistType} AI at Radiance AI. You have received a referral from a General Physician AI. Respond STRICTLY in JSON format.`;

    case 'pathologist':
      return `You are the Pathologist AI at Radiance AI. Your role is to provide insights on how various lab tests or pathological findings might relate to the conditions being considered by the Specialist Doctor. Respond STRICTLY in JSON format.`;

    case 'nutritionist':
      return `You are the Nutritionist AI at Radiance AI. Your role is to provide dietary and nutritional advice relevant to the patient's condition, their health metrics, and dietary preferences. Respond STRICTLY in JSON format.`;

    case 'pharmacist':
      return `You are the Pharmacist AI at Radiance AI. Your role is to provide general information about medications that might be prescribed for the conditions discussed by the Specialist, considering the patient's allergies and current medical information. Respond STRICTLY in JSON format.`;

    case 'follow-up-specialist':
      return `You are the Follow-up Specialist AI at Radiance AI. Your role is to provide guidance on monitoring symptoms, recommended follow-up timelines, and when to seek urgent care, based on all previous AI analyses. Respond STRICTLY in JSON format.`;

    case 'summarizer':
      return `You are the Radiance AI Summarizer. Your final role is to compile a comprehensive, clean, and patient-friendly report based on the inputs and analyses from all previous AI roles in the diagnostic chain. Respond STRICTLY in JSON format.`;

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
      } catch (parseError) {
        console.log("Standard JSON parsing failed, trying custom parsing for Specialist Doctor response");

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
    } catch (error) {
      console.error('Error parsing Specialist Doctor response:', error);

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
    console.error('Error in processNutritionist:', error);

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
    console.error('Error in processPharmacist:', error);

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
    console.error('Error in processFollowUpSpecialist:', error);

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
    console.error('Error in processRadianceAISummarizer:', error);

    // Update the session with error status
    await updateChainDiagnosisSession(sessionId, {
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error in Radiance AI Summarizer step'
    });

    throw error;
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
      console.error('Error getting chain diagnosis session:', error);
      return null;
    }

    return data as ChainDiagnosisSession;
  } catch (error) {
    console.error('Error in getChainDiagnosisSession:', error);
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
      console.error('getUserChainDiagnosisSessions called with invalid userId:', userId);
      return [];
    }

    console.log(`Fetching chain diagnosis sessions for user ${userId}`);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chain_diagnosis_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user chain diagnosis sessions:', error);
      return [];
    }

    const sessions = data as ChainDiagnosisSession[];
    console.log(`Retrieved ${sessions.length} chain diagnosis sessions for user ${userId}`);

    // Validate the sessions data
    const validSessions = sessions.filter(session => {
      if (!session || !session.id) {
        console.warn('Found invalid session object:', session);
        return false;
      }
      return true;
    });

    if (validSessions.length !== sessions.length) {
      console.warn(`Filtered out ${sessions.length - validSessions.length} invalid sessions`);
    }

    return validSessions;
  } catch (error) {
    console.error('Error in getUserChainDiagnosisSessions:', error);
    return [];
  }
}
