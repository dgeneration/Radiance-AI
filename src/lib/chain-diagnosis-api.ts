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
    // Initialize the database tables if they don't exist
    await initChainDiagnosisDb();

    const sessionId = uuidv4();
    const session: ChainDiagnosisSession = {
      id: sessionId,
      user_id: userInput.user_details.id,
      created_at: new Date().toISOString(),
      user_input: userInput,
      status: 'in_progress',
      current_step: 0
    };

    // Store the session in Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from('chain_diagnosis_sessions')
      .insert(session);

    if (error) {
      console.error('Error storing chain diagnosis session:', error);

      // If the error is related to the table not existing, try to initialize again
      if (error.message && (
          error.message.includes('does not exist') ||
          error.message.includes('relation') ||
          error.code === '42P01')) {
        console.log('Table might not exist, trying to initialize again...');
        await initChainDiagnosisDb();

        // Try inserting again
        const { error: retryError } = await supabase
          .from('chain_diagnosis_sessions')
          .insert(session);

        if (retryError) {
          console.error('Error storing chain diagnosis session after retry:', retryError);
          throw new Error('Failed to initialize chain diagnosis session: ' + retryError.message);
        }
      } else {
        throw new Error('Failed to initialize chain diagnosis session: ' + error.message);
      }
    }

    return session;
  } catch (error) {
    console.error('Error in initializeChainDiagnosisSession:', error);
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
  userPrompt: string,
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler
): Promise<PerplexityResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new Error('Perplexity API key is not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
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
      })
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

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Final call with complete response
          onStreamingResponse(fullResponse, true);
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

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
              fullResponse += content;
              onStreamingResponse(content, false);
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
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
    console.error('Error in makePerplexityRequest:', error);
    throw error;
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
    let cleanedContent = content.replace(/<[^>]*>/g, '').trim();

    // Try to extract JSON object from the content
    const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to parse the entire cleaned content as JSON
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    throw new Error('Failed to parse API response as JSON');
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
      console.error('Error updating chain diagnosis session:', error);
      throw new Error('Failed to update chain diagnosis session');
    }
  } catch (error) {
    console.error('Error in updateChainDiagnosisSession:', error);
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
      return `You are the Medical Analyst AI at Radiance AI. Your primary role is to analyze uploaded medical test reports (text-based or descriptions of images) provided in the user input. Respond STRICTLY in JSON format.`;

    case 'general-physician':
      return `You are the General Physician AI at Radiance AI. Your role is to provide an initial assessment based on patient information and symptoms, and if available, a medical analyst's report summary. Respond STRICTLY in JSON format.`;

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
): Promise<MedicalAnalystResponse | null> {
  try {
    // Skip if no medical report is present
    if (!userInput.medical_report?.text) {
      console.log('No medical report provided, skipping Medical Analyst AI step');

      // Update the session to skip this step
      await updateChainDiagnosisSession(sessionId, {
        current_step: 1
      });

      return null;
    }

    // Enhanced system prompt for Medical Analyst
    const systemPrompt = `${getSystemPrompt('medical-analyst')}

You are analyzing a medical report with the following details:
- Report Type: ${userInput.medical_report.type || 'Unknown'}
- Report Name: ${userInput.medical_report.name || 'Unknown'}

Your task is to:
1. Identify key findings from the report
2. Highlight any abnormalities
3. Provide clinical correlation points for the General Physician

Respond in JSON format with the following structure:
{
  "role_name": "Medical Analyst AI (Radiance AI)",
  "report_type_analyzed": "string",
  "key_findings_from_report": ["string"],
  "abnormalities_highlighted": ["string"],
  "clinical_correlation_points_for_gp": ["string"],
  "disclaimer": "string",
  "reference_data_for_next_role": {
    "analyst_summary": "string",
    "raw_findings_ref": "string"
  }
}`;

    // Prepare a focused user prompt with just the medical report
    const userPrompt = JSON.stringify({
      patient_info: {
        age: userInput.user_details.age,
        gender: userInput.user_details.gender,
        symptoms: userInput.symptoms_info.symptoms_list,
        medical_history: userInput.medical_info?.medical_conditions || ''
      },
      medical_report: {
        type: userInput.medical_report.type || 'Unknown',
        name: userInput.medical_report.name || 'Unknown',
        text: userInput.medical_report.text
      }
    }, null, 2);

    // Make the API request with streaming support
    const response = await makePerplexityRequest(
      'sonar-deep-research',
      systemPrompt,
      userPrompt,
      streaming,
      onStreamingResponse
    );

    const content = response.choices[0].message.content;

    // Parse the response with better error handling
    let parsedResponse: MedicalAnalystResponse;
    try {
      parsedResponse = parseJsonResponse<MedicalAnalystResponse>(content);

      // Validate the response has the required fields
      if (!parsedResponse.role_name || !parsedResponse.reference_data_for_next_role) {
        throw new Error('Invalid response format from Medical Analyst AI');
      }

      // Ensure the disclaimer is present
      if (!parsedResponse.disclaimer) {
        parsedResponse.disclaimer = "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.";
      }

      // Ensure the report type is present
      if (!parsedResponse.report_type_analyzed) {
        parsedResponse.report_type_analyzed = userInput.medical_report.type || 'Medical Report';
      }

    } catch (error) {
      console.error('Error parsing Medical Analyst response:', error);

      // Create a fallback response
      parsedResponse = {
        role_name: "Medical Analyst AI (Radiance AI)",
        report_type_analyzed: userInput.medical_report.type || 'Medical Report',
        key_findings_from_report: ["Unable to extract structured findings from the report"],
        abnormalities_highlighted: [],
        clinical_correlation_points_for_gp: ["Please review the raw report text directly"],
        disclaimer: "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.",
        reference_data_for_next_role: {
          analyst_summary: "The Medical Analyst AI was unable to properly analyze the report. Please refer to the original report text.",
          raw_findings_ref: userInput.medical_report.text.substring(0, 500) + (userInput.medical_report.text.length > 500 ? '...' : '')
        }
      };
    }

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      medical_analyst_response: parsedResponse,
      current_step: 1
    });

    return parsedResponse;
  } catch (error) {
    console.error('Error in processMedicalAnalyst:', error);

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
    const parsedResponse = parseJsonResponse<GeneralPhysicianResponse>(content);

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      general_physician_response: parsedResponse,
      current_step: 2
    });

    return parsedResponse;
  } catch (error) {
    console.error('Error in processGeneralPhysician:', error);

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
    const parsedResponse = parseJsonResponse<SpecialistDoctorResponse>(content);

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      specialist_doctor_response: parsedResponse,
      current_step: 3
    });

    return parsedResponse;
  } catch (error) {
    console.error('Error in processSpecialistDoctor:', error);

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

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      pathologist_response: parsedResponse,
      current_step: 4
    });

    return parsedResponse;
  } catch (error) {
    console.error('Error in processPathologist:', error);

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

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      nutritionist_response: parsedResponse,
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

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      pharmacist_response: parsedResponse,
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

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      follow_up_specialist_response: parsedResponse,
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

    // Update the session in the database
    await updateChainDiagnosisSession(sessionId, {
      summarizer_response: parsedResponse,
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

    return data as ChainDiagnosisSession[];
  } catch (error) {
    console.error('Error in getUserChainDiagnosisSessions:', error);
    return [];
  }
}
