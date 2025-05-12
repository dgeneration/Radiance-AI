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
    if (!globalThis.dbInitialized) {
      console.log('First run detected, checking database initialization...');
      try {
        await initChainDiagnosisDb();
        globalThis.dbInitialized = true;
        console.log('Database initialization check completed.');
      } catch (dbInitError) {
        // Suppress the error to avoid console noise
        console.log('Note: Database initialization check completed with some warnings.');
        globalThis.dbInitialized = true; // Still mark as initialized to avoid repeated attempts
      }
    } else {
      console.log('Database already initialized, skipping initialization check.');
    }

    // Store the session in Supabase
    const supabase = createClient();

    // First, check if the user is authenticated
    let userId = userInput.user_id; // Default to the provided user ID

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id; // Use authenticated user ID if available
        console.log('Using authenticated user ID:', userId);
      } else {
        console.warn('User is not authenticated, using provided user ID:', userId);
      }
    } catch (authError) {
      console.error('Error getting authenticated user:', authError);
      console.warn('Continuing with provided user ID:', userId);
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
    let databaseInsertSuccessful = false;

    try {
      console.log('Attempting to insert session into database...');

      // First attempt to insert with the authenticated client
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

          // Skip reinitialization since we know the table exists
          // Just try inserting again with better error handling
          try {
            console.log('Retrying session insert without reinitialization...');

            const { error: retryError } = await supabase
              .from('chain_diagnosis_sessions')
              .insert(session);

            if (retryError) {
              // Don't log the full error, just a user-friendly message
              console.log('Could not store session in database. Using in-memory session instead.');
              console.warn('Will continue with in-memory session');
            } else {
              databaseInsertSuccessful = true;
              console.log('Session inserted successfully on retry');
            }
          } catch (retryError) {
            // Suppress the error to avoid console noise
            console.log('Could not store session in database. Using in-memory session instead.');
            console.warn('Will continue with in-memory session');
          }
        }
        // If we get an RLS policy violation, it means the user_id doesn't match auth.uid()
        else if (error.message && error.message.includes('violates row-level security policy')) {
          console.log('Note: RLS policy check detected. This is normal if you are not authenticated.');

          // Simplified auth check and retry
          try {
            // Get the current user without refreshing the session
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (currentUser) {
              // If we have a user, update the session user_id and try again
              console.log('Using authenticated user ID for session:', currentUser.id);
              session.user_id = currentUser.id;

              // Try one more time with the correct user ID
              const { error: finalAttemptError } = await supabase
                .from('chain_diagnosis_sessions')
                .insert(session);

              if (finalAttemptError) {
                // Don't log the full error, just a user-friendly message
                console.log('Could not store session in database. Using in-memory session instead.');
              } else {
                databaseInsertSuccessful = true;
                console.log('Session inserted successfully with authenticated user ID');
              }
            } else {
              // If no user is authenticated, just continue with in-memory session
              console.log('No authenticated user found. Using in-memory session.');
            }
          } catch (authError) {
            // Suppress the error to avoid console noise
            console.log('Could not verify authentication. Using in-memory session.');
          }
        } else {
          // Don't log the full error, just a user-friendly message
          console.log('Could not store session in database. Using in-memory session instead.');
        }
      } else {
        databaseInsertSuccessful = true;
        console.log('Session inserted successfully on first attempt');
      }
    } catch (insertError) {
      // Suppress the error to avoid console noise
      console.log('Could not store session in database. Using in-memory session instead.');
    }

    if (databaseInsertSuccessful) {
      console.log('Successfully stored session in database with ID:', session.id);
    } else {
      console.log('Using in-memory session with ID:', session.id);
      // Use a more user-friendly message
      console.log('Note: This session is temporary and will not persist between page refreshes.');
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
  userPrompt: string | any[],
  streaming: boolean = false,
  onStreamingResponse?: StreamingResponseHandler,
  hasImageUrl: boolean = false
): Promise<PerplexityResponse> {
  try {
    // Use the correct environment variable name
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.error('Perplexity API key is not configured. Check your environment variables.');
      throw new Error('Perplexity API key is not configured');
    }

    console.log(`Making API request to Perplexity using model: ${model}`);
    console.log(`API Key status: ${apiKey ? 'API key is set' : 'API key is missing'}`);
    console.log(`API Key prefix: ${apiKey ? apiKey.substring(0, 5) + '...' : 'N/A'}`);
    console.log(`API Key length: ${apiKey ? apiKey.length : 0}`);
    console.log(`Streaming mode: ${streaming ? 'enabled' : 'disabled'}`);

    // For client-side requests, we need to use the API route
    if (typeof window !== 'undefined') {
      console.log('Running in browser environment, using API route');

      // If streaming is enabled, handle it differently
      if (streaming && onStreamingResponse) {
        console.log('Setting up client-side streaming...');

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
          console.error(`API route error: ${response.status} - ${errorText}`);
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
              console.log('Client-side stream complete, final response length:', fullResponse.length);
              // Final call with complete response
              onStreamingResponse(fullResponse, true);
              break;
            }

            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            console.log('Client received chunk, size:', chunk.length);

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
                    console.log('Client streaming content chunk:', content.length);
                    onStreamingResponse(content, false);
                  }
                } catch (e) {
                  console.error('Error parsing client streaming response:', e, 'Line:', data);
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Error processing client stream:', streamError);
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
          console.error(`API route error: ${response.status} - ${errorText}`);
          throw new Error(`API route error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      }
    }

    // Prepare the request body based on whether we have an image URL
    let requestBody;

    if (hasImageUrl) {
      console.log('Using image URL format for Perplexity API');

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

      console.log('Request with image URL:', JSON.stringify(requestBody, null, 2));
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

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
      console.log('Processing streaming response...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Stream complete, final response length:', fullResponse.length);
            // Final call with complete response
            onStreamingResponse(fullResponse, true);
            break;
          }

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          console.log('Received chunk, size:', chunk.length);
          console.log('Current buffer size:', buffer.length);

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
                  console.log('Streaming content chunk:', content.length);
                  onStreamingResponse(content, false);
                }
              } catch (e) {
                console.error('Error parsing streaming response:', e);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
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
    console.log('Parsing JSON response, content preview:', content.substring(0, 100) + '...');

    // Clean up the content by removing any XML-like tags
    let cleanedContent = content.replace(/<[^>]*>.*?<\/[^>]*>/gs, '').replace(/<[^>]*>/g, '').trim();
    console.log('Cleaned content preview:', cleanedContent.substring(0, 100) + '...');

    // Try to extract JSON object from the content
    const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);

    if (jsonMatch && jsonMatch[1]) {
      console.log('Found JSON in code block, preview:', jsonMatch[1].substring(0, 100) + '...');
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (codeBlockError) {
        console.error('Error parsing JSON from code block:', codeBlockError);
        // Continue to other methods
      }
    }

    // Try to find JSON object in the text (sometimes it's not in a code block)
    const jsonObjectMatch = cleanedContent.match(/(\{[\s\S]*\})/);
    if (jsonObjectMatch && jsonObjectMatch[1]) {
      console.log('Found JSON object in text, preview:', jsonObjectMatch[1].substring(0, 100) + '...');
      try {
        return JSON.parse(jsonObjectMatch[1]);
      } catch (innerError) {
        console.error('Error parsing JSON object from text:', innerError);
        // Continue to other methods
      }
    }

    // If we have a Markdown response, try to convert it to JSON
    if (cleanedContent.startsWith('#') || cleanedContent.includes('\n## ')) {
      console.log('Detected Markdown response, converting to JSON...');

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

      console.log('Created structured JSON from Markdown');
      return markdownJson as unknown as T;
    }

    // Try to parse the entire cleaned content as JSON
    console.log('Attempting to parse entire cleaned content as JSON');
    try {
      // First try to parse as is
      try {
        return JSON.parse(cleanedContent);
      } catch (initialError) {
        console.log('Initial JSON parsing failed, attempting to fix common JSON syntax errors...');

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
        console.log('Checking for specific error around position 2227...');

        // Try to identify and fix the specific issue around position 2227
        if (fixedJson.length > 2200) {
          const problemArea = fixedJson.substring(2200, 2250);
          console.log('Problem area around position 2227:', problemArea);

          // Look for common syntax errors in this area
          // 1. Missing comma between properties
          fixedJson = fixedJson.replace(/}(\s*)"([^"]+)":/g, '},$1"$2":');

          // 2. Extra comma before closing brace
          fixedJson = fixedJson.replace(/,(\s*})/g, '$1');

          // 3. Missing quotes around property names
          fixedJson = fixedJson.substring(0, 2200) +
                     fixedJson.substring(2200).replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
        }

        console.log('Attempting to parse fixed JSON...');
        return JSON.parse(fixedJson);
      }
    } catch (finalError) {
      console.error('Error parsing entire content as JSON even after fixes:', finalError);

      // Try one more approach: extract what looks like a JSON object
      try {
        console.log('Attempting to extract and parse what looks like a JSON object...');

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
          console.log('Extracted balanced JSON object, attempting to parse...');
          try {
            return JSON.parse(extractedJson);
          } catch (balancedError) {
            console.error('Failed to parse balanced JSON object:', balancedError);
          }
        }

        // If that fails, try a more aggressive regex approach
        const jsonObjectRegex = /\{[\s\S]*\}/;
        const match = cleanedContent.match(jsonObjectRegex);
        if (match && match[0]) {
          const extractedJson = match[0];
          console.log('Extracted potential JSON object using regex, attempting to parse...');
          try {
            return JSON.parse(extractedJson);
          } catch (regexError) {
            console.error('Failed to parse regex-extracted JSON:', regexError);
          }
        }

        // Last resort: Try to manually reconstruct a valid JSON object
        console.log('Attempting to manually reconstruct a valid JSON object...');

        // Extract key-value pairs using regex
        const keyValuePairs: Record<string, any> = {};
        const keyValueRegex = /"([^"]+)"\s*:\s*(?:"([^"]+)"|(\[[^\]]*\])|(\{[^}]*\})|([^,}]+))/g;
        let keyValueMatch;

        while ((keyValueMatch = keyValueRegex.exec(cleanedContent)) !== null) {
          const key = keyValueMatch[1];
          // Determine which capture group has the value
          let value = keyValueMatch[2] || keyValueMatch[3] || keyValueMatch[4] || keyValueMatch[5];

          // If it's a string, keep it as is
          if (keyValueMatch[2]) {
            keyValuePairs[key] = value;
          }
          // If it's an array or object, try to parse it
          else if (keyValueMatch[3] || keyValueMatch[4]) {
            try {
              keyValuePairs[key] = JSON.parse(value);
            } catch (parseError) {
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
          console.log('Manually reconstructed JSON object with keys:', Object.keys(keyValuePairs));
          return keyValuePairs as unknown as T;
        }
      } catch (extractError) {
        console.error('Failed to extract and parse JSON object:', extractError);
      }

      throw finalError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    console.log('Content preview for debugging:', content.substring(0, 300) + '...');

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

If no medical report or image was provided (indicated by no_medical_report: true in the input), you should proceed with your assessment based solely on the patient's symptoms and medical history.

Respond STRICTLY in JSON format.`;

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
    console.log('Starting Medical Analyst processing for session:', sessionId);
    console.log('Streaming mode:', streaming ? 'enabled' : 'disabled');
    console.log('User input summary:', {
      age: userInput.user_details.age,
      gender: userInput.user_details.gender,
      symptoms_count: userInput.symptoms_info.symptoms_list.length,
      has_medical_report: !!userInput.medical_report?.text
    });

    // Check if we have a medical report or an image URL
    const hasReport = !!userInput.medical_report?.text;
    const hasImageUrl = !!userInput.medical_report?.image_url;

    console.log('Medical Analyst Input:', {
      hasReport,
      hasImageUrl,
      reportText: userInput.medical_report?.text ? userInput.medical_report.text.substring(0, 100) + '...' : 'None',
      imageUrl: userInput.medical_report?.image_url || 'None',
      reportType: userInput.medical_report?.type || 'None',
      reportName: userInput.medical_report?.name || 'None',
      reportUrl: userInput.medical_report?.url || 'None'
    });

    if (!hasReport && !hasImageUrl) {
      console.log('No medical report or image URL provided, skipping Medical Analyst AI step');

      // Update the session to skip directly to General Physician (step 1)
      await updateChainDiagnosisSession(sessionId, {
        current_step: 1,
        status: 'in_progress',
        medical_analyst_response: null
      });

      console.log('Skipped Medical Analyst step, proceeding to General Physician');
      return null;
    }

    if (hasImageUrl) {
      console.log('Image URL found:', userInput.medical_report?.image_url);
    }

    if (hasReport) {
      console.log('Medical report found, proceeding with analysis');
    }

    // Enhanced system prompt for Medical Analyst
    const systemPrompt = `${getSystemPrompt('medical-analyst')}

You are analyzing a medical ${hasImageUrl ? 'image' : 'report'} with the following details:
- Report Type: ${userInput.medical_report.type || 'Unknown'}
- Report Name: ${userInput.medical_report.name || 'Unknown'}
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
      console.log('Preparing image URL format with URL:', userInput.medical_report.image_url);

      // Check if the image URL is valid
      if (!userInput.medical_report.image_url || !userInput.medical_report.image_url.startsWith('http')) {
        console.error('Invalid image URL format:', userInput.medical_report.image_url);
        console.log('Image URL must start with http:// or https://');
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
            url: userInput.medical_report.image_url
          }
        }
      ];

      console.log('Image URL request format:', JSON.stringify(userPromptContent, null, 2));

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
    const userPrompt = userPromptContent;

    // Make the API request with streaming support
    console.log('Making API request to Perplexity for Medical Analyst...');
    console.log('Using model: sonar-deep-research');

    let response;
    try {
      // Disable streaming for image URLs
      if (hasImageUrl) {
        console.log('Image URL detected, disabling streaming for better compatibility');
        streaming = false;
      }

      // First try with streaming enabled (if not disabled)
      if (streaming) {
        console.log('Attempting streaming request...');
        try {
          response = await makePerplexityRequest(
            'sonar-deep-research',
            systemPrompt,
            userPrompt,
            true,
            onStreamingResponse,
            hasImageUrl
          );

          console.log('Received streaming response from Perplexity API');
          console.log('Response structure:', Object.keys(response));

          if (!response.choices || !response.choices[0]) {
            console.warn('Invalid streaming response structure, will try non-streaming fallback');
            throw new Error('Invalid streaming response structure');
          }
        } catch (streamingError) {
          console.warn('Streaming request failed, falling back to non-streaming request:', streamingError);

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

          console.log('Received non-streaming fallback response');

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

        console.log('Received standard response from Perplexity API');
      }

      console.log('Response structure:', Object.keys(response));

      if (!response.choices || !response.choices[0]) {
        console.error('Invalid response structure from Perplexity API:', response);
        throw new Error('Invalid response structure from Perplexity API');
      }

    } catch (apiError) {
      console.error('Error making Perplexity API request:', apiError);
      throw new Error(`Perplexity API request failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }

    const content = response.choices[0].message.content;
    console.log('Response content length:', content.length);
    console.log('Response content preview:', content.substring(0, 100) + '...');

    // Parse the response with better error handling
    let parsedResponse: MedicalAnalystResponse;
    try {
      console.log('Attempting to parse Medical Analyst response...');
      parsedResponse = parseJsonResponse<MedicalAnalystResponse>(content);
      console.log('Successfully parsed response, checking required fields...');

      // Validate and ensure all required fields are present
      if (!parsedResponse.role_name) {
        console.log('Adding missing role_name field');
        parsedResponse.role_name = "Medical Analyst AI (Radiance AI)";
      }

      if (!parsedResponse.report_type_analyzed) {
        console.log('Adding missing report_type_analyzed field');
        parsedResponse.report_type_analyzed = userInput.medical_report.type || 'Medical Report';
      }

      if (!parsedResponse.key_findings_from_report || !Array.isArray(parsedResponse.key_findings_from_report)) {
        console.log('Adding missing or fixing key_findings_from_report field');
        parsedResponse.key_findings_from_report = ["See full analysis in the reference data"];
      }

      if (!parsedResponse.abnormalities_highlighted || !Array.isArray(parsedResponse.abnormalities_highlighted)) {
        console.log('Adding missing or fixing abnormalities_highlighted field');
        parsedResponse.abnormalities_highlighted = [];
      }

      if (!parsedResponse.clinical_correlation_points_for_gp || !Array.isArray(parsedResponse.clinical_correlation_points_for_gp)) {
        console.log('Adding missing or fixing clinical_correlation_points_for_gp field');
        parsedResponse.clinical_correlation_points_for_gp = ["Please review the full analysis"];
      }

      if (!parsedResponse.disclaimer) {
        console.log('Adding missing disclaimer field');
        parsedResponse.disclaimer = "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.";
      }

      if (!parsedResponse.reference_data_for_next_role) {
        console.log('Adding missing reference_data_for_next_role field');
        parsedResponse.reference_data_for_next_role = {
          analyst_summary: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
          raw_findings_ref: content.substring(0, 1000) + (content.length > 1000 ? '...' : '')
        };
      } else {
        // Ensure the nested fields exist
        if (!parsedResponse.reference_data_for_next_role.analyst_summary) {
          console.log('Adding missing analyst_summary field');
          parsedResponse.reference_data_for_next_role.analyst_summary = content.substring(0, 500) + (content.length > 500 ? '...' : '');
        }

        if (!parsedResponse.reference_data_for_next_role.raw_findings_ref) {
          console.log('Adding missing raw_findings_ref field');
          parsedResponse.reference_data_for_next_role.raw_findings_ref = content.substring(0, 1000) + (content.length > 1000 ? '...' : '');
        }
      }

      console.log('All required fields are present and valid');

    } catch (error) {
      console.error('Error parsing Medical Analyst response:', error);
      console.log('Creating fallback response with the raw content');

      // Create a fallback response that includes the raw content
      parsedResponse = {
        role_name: "Medical Analyst AI (Radiance AI)",
        report_type_analyzed: userInput.medical_report.type || 'Medical Report',
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
        medicalAnalystResponse.reference_data_for_next_role : undefined,
      no_medical_report: !userInput.medical_report?.text && !userInput.medical_report?.image_url
    };

    console.log('General Physician Input:', {
      hasAnalystData: !!medicalAnalystResponse,
      noMedicalReport: !userInput.medical_report?.text && !userInput.medical_report?.image_url
    });

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

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      specialist_doctor_response: parsedResponse,
      raw_specialist_doctor_response: content, // Save the raw API response
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

    // Update the session in the database with both parsed and raw responses
    await updateChainDiagnosisSession(sessionId, {
      pathologist_response: parsedResponse,
      raw_pathologist_response: content, // Save the raw API response
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
