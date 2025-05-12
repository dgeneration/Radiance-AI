import { v4 as uuidv4 } from 'uuid';
import { ChainDiagnosisUserInput, MedicalAnalystResponse, PerplexityResponse } from '@/types/chain-diagnosis';

/**
 * Make a request to the Perplexity API with detailed logging
 * @param model The Perplexity model to use
 * @param systemPrompt The system prompt
 * @param userPrompt The user prompt
 * @returns The API response with request details
 */
export async function makeTestPerplexityRequest(
  model: string,
  systemPrompt: string,
  userPrompt: string | any[],
  hasImageUrl: boolean = false
): Promise<{ request: any; response: any }> {
  try {
    // Use the correct environment variable name
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.error('Perplexity API key is not configured. Check your environment variables.');
      throw new Error('Perplexity API key is not configured');
    }

    console.log(`Making test API request to Perplexity using model: ${model}`);
    console.log(`Request has image URL: ${hasImageUrl}`);

    // For client-side requests, we need to use the API route
    if (typeof window !== 'undefined') {
      console.log('Running in browser environment, using API route');

      // Prepare the request object for logging
      const requestObject = {
        model,
        systemPrompt,
        userPrompt,
        streaming: false,
        hasImageUrl
      };

      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestObject),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API route error: ${response.status} - ${errorText}`);
        throw new Error(`API route error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();

      return {
        request: requestObject,
        response: responseData
      };
    }

    // Prepare the request object for logging
    let requestObject;

    if (hasImageUrl) {
      // For image URLs, we need to use a different format
      // The content is already an array of objects with type "text" or "image_url"
      const parsedUserPrompt = typeof userPrompt === 'string' ? JSON.parse(userPrompt) : userPrompt;

      requestObject = {
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
        stream: false
      };
    } else {
      // For text-only requests, use the standard format
      requestObject = {
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
        stream: false
      };
    }

    console.log('Request object:', JSON.stringify(requestObject, null, 2));

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestObject)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();

    return {
      request: requestObject,
      response: responseData
    };
  } catch (error) {
    console.error('Error in makeTestPerplexityRequest:', error);
    throw error;
  }
}

/**
 * Process the Medical Analyst AI step with detailed logging
 * @param sessionId The session ID
 * @param userInput The user input data
 * @returns The Medical Analyst response with request details
 */
export async function testMedicalAnalyst(
  sessionId: string,
  userInput: ChainDiagnosisUserInput
): Promise<{ request: any; response: any; parsedResponse: MedicalAnalystResponse | null }> {
  try {
    console.log('Starting Test Medical Analyst processing for session:', sessionId);

    // Skip if no medical report is present
    if (!userInput.medical_report?.text) {
      console.log('No medical report provided, skipping Medical Analyst AI step');
      return {
        request: userInput,
        response: null,
        parsedResponse: null
      };
    }

    console.log('Medical report found, proceeding with analysis');

    // Check if there's an image URL in the medical report
    const hasImageUrl = 'image_url' in userInput.medical_report && userInput.medical_report.image_url;

    if (hasImageUrl) {
      console.log('Image URL detected:', userInput.medical_report.image_url);
    }

    // Enhanced system prompt for Medical Analyst
    const systemPrompt = `You are the Medical Analyst AI at Radiance AI. Your primary role is to analyze uploaded medical test reports (text-based or descriptions of images) provided in the user input. Respond STRICTLY in JSON format.

You are analyzing a medical report with the following details:
- Report Type: ${userInput.medical_report.type || 'Unknown'}
- Report Name: ${userInput.medical_report.name || 'Unknown'}
${hasImageUrl ? '- Image URL: ' + userInput.medical_report.image_url : ''}

${hasImageUrl ? `IMPORTANT: This request includes a medical image URL. You should:
1. Analyze the image at the provided URL
2. Describe what you see in the image
3. Identify any abnormalities or findings visible in the image
4. Incorporate your image analysis into your overall assessment` : ''}

Your task is to:
1. Identify key findings from the report${hasImageUrl ? ' and image' : ''}
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

    // For image URLs, we need to use a different format for the Perplexity API
    // The API expects an array of content objects with type "text" or "image_url"
    let userPromptContent;

    if (hasImageUrl) {
      // For image URLs, we need to use the specific format required by Perplexity
      userPromptContent = [
        {
          type: "text",
          text: `Please analyze this medical image in the context of the following information:
Patient Info:
- Age: ${userInput.user_details.age}
- Gender: ${userInput.user_details.gender}
- Symptoms: ${userInput.symptoms_info.symptoms_list.join(', ')}
${userInput.medical_info?.medical_conditions ? `- Medical History: ${userInput.medical_info.medical_conditions}` : ''}

Report Type: ${userInput.medical_report.type || 'Unknown'}
Report Name: ${userInput.medical_report.name || 'Unknown'}
${userInput.medical_report.text ? `Additional Context: ${userInput.medical_report.text}` : ''}

Please provide a detailed analysis of the medical image.`
        },
        {
          type: "image_url",
          image_url: {
            url: userInput.medical_report.image_url
          }
        }
      ];

      console.log('Using image URL format for Perplexity API');
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
          type: userInput.medical_report.type || 'Unknown',
          name: userInput.medical_report.name || 'Unknown',
          text: userInput.medical_report.text
        }
      }, null, 2);
    }

    // Store the user prompt for debugging
    const userPrompt = hasImageUrl ? JSON.stringify(userPromptContent, null, 2) : userPromptContent;

    // We've already enhanced the system prompt above

    // Make the API request
    console.log('Making test API request to Perplexity for Medical Analyst...');
    console.log('Using model: sonar-deep-research');

    const { request, response } = await makeTestPerplexityRequest(
      'sonar-deep-research',
      systemPrompt,
      userPromptContent,
      hasImageUrl
    );

    console.log('Received response from Perplexity API');

    if (!response.choices || !response.choices[0]) {
      console.error('Invalid response structure from Perplexity API:', response);
      throw new Error('Invalid response structure from Perplexity API');
    }

    const content = response.choices[0].message.content;
    console.log('Response content length:', content.length);
    console.log('Response content preview:', content.substring(0, 100) + '...');

    // Parse the response
    let parsedResponse: MedicalAnalystResponse | null = null;
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

    return {
      request: {
        sessionId,
        userInput,
        systemPrompt,
        userPrompt,
        apiRequest: request
      },
      response: response,
      parsedResponse: parsedResponse
    };
  } catch (error) {
    console.error('Error in testMedicalAnalyst:', error);
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
    console.log('Parsing JSON response, content preview:', content.substring(0, 100) + '...');

    // Clean up the content by removing any XML-like tags
    let cleanedContent = content.replace(/<[^>]*>.*?<\/[^>]*>/gs, '').replace(/<[^>]*>/g, '').trim();
    console.log('Cleaned content preview:', cleanedContent.substring(0, 100) + '...');

    // Try to extract JSON object from the content
    const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch && jsonMatch[1]) {
      console.log('Found JSON in code block, preview:', jsonMatch[1].substring(0, 100) + '...');
      return JSON.parse(jsonMatch[1]);
    }

    // Try to find JSON object in the text (sometimes it's not in a code block)
    const jsonObjectMatch = cleanedContent.match(/(\{[\s\S]*\})/);
    if (jsonObjectMatch && jsonObjectMatch[1]) {
      console.log('Found JSON object in text, preview:', jsonObjectMatch[1].substring(0, 100) + '...');
      try {
        return JSON.parse(jsonObjectMatch[1]);
      } catch (innerError) {
        console.error('Error parsing JSON object from text:', innerError);
      }
    }

    // Try to parse the entire cleaned content as JSON
    console.log('Attempting to parse entire cleaned content as JSON');
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    throw new Error('Failed to parse API response as JSON');
  }
}
