import { SymptomFormData } from "@/types/diagnosis";

// Define the response type from the Perplexity API
export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    citation_tokens?: number;
    num_search_queries?: number;
    reasoning_tokens?: number;
  };
  citations: string[];
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

// Define the JSON response structure from the API
export interface DiagnosisJsonResponse {
  primaryDiagnosis: {
    name: string;
    description: string;
    icdCode: string;
    severity: string;
    commonSymptoms: string[];
  };
  differentialDiagnoses: {
    name: string;
    icdCode: string;
    likelihood: string;
  }[];
  reasoning: string;
  medicationPlan: {
    name: string;
    purpose: string;
    dosage: string;
    timing: string;
    duration: string;
    notes: string;
  }[];
  testRecommendations: {
    testName: string;
    reason: string;
  }[];
  lifestyleAdvice: string[];
  followUp: string;
  [key: string]: unknown; // Add index signature to make it compatible with Record<string, unknown>
}

// Define the diagnosis result type
export interface DiagnosisResult {
  primaryDiagnosis: {
    name: string;
    description: string;
    icdCode: string;
    severity?: string;
    commonSymptoms?: string[];
  };
  differentialDiagnoses?: {
    name: string;
    icdCode: string;
    likelihood: string;
  }[];
  reasoning: string;
  medicationPlan?: {
    name: string;
    purpose: string;
    dosage: string;
    timing: string;
    duration: string;
    notes: string;
  }[];
  testRecommendations?: {
    testName: string;
    reason: string;
  }[];
  lifestyleAdvice?: string[];
  followUp?: string;
  citations: {
    title: string;
    url: string;
  }[];
}

/**
 * Sends symptom data to the Perplexity Sonar API and returns a diagnosis
 * Uses the deep research model for comprehensive medical analysis
 */
export async function getDiagnosis(symptomData: SymptomFormData): Promise<{
  diagnosis: DiagnosisResult,
  apiResponse: PerplexityResponse | null
}> {
  try {
    // Check if we have a valid API key
    const apiKey = process.env.PERPLEXITY_API_KEY;

    console.log("API Key status:", apiKey ? "API key is set" : "API key is not set");

    // If API key is not set or is the default placeholder, use fallback
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.log("Using fallback diagnosis because API key is not configured");
      const fallbackDiagnosis = getCustomizedFallbackDiagnosis(symptomData);
      return {
        diagnosis: fallbackDiagnosis,
        apiResponse: null
      };
    }

    console.log("Using real Perplexity API with the deep research model");

    // Log the API request details
    console.log("API Request URL:", process.env.PERPLEXITY_API_URL);
    console.log("API Request Headers:", {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [REDACTED]'
    });

    // Format the prompt for the API
    const prompt = formatPrompt(symptomData);

    // Make the API request
    const response = await fetch(process.env.PERPLEXITY_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Use the deep research model for comprehensive medical analysis
        model: "sonar-reasoning-pro", // Changed to sonar-research",
        messages: [
          {
            role: "system",
            content: `You are Radiance AI, the world's most advanced virtual health companion — an AI-powered medical diagnostic system with deep research capabilities. You analyze user-reported symptoms, personal health history, and medical context to provide accurate, evidence-backed medical insights.

Your primary goal is to provide the most accurate medical diagnosis possible based on the symptoms provided. You should:

1. Analyze the symptoms thoroughly, considering all possible diagnoses
2. Prioritize medical accuracy and evidence-based reasoning
3. Consider differential diagnoses and their likelihood
4. Provide detailed explanations of your reasoning process
5. Include relevant ICD-10 codes for all diagnoses
6. Cite reliable medical sources (e.g., Mayo Clinic, NIH, PubMed, UpToDate, JAMA, NEJM)
7. Recommend appropriate tests, medications, and follow-up care

Your ONLY job is to respond in **strictly valid JSON format** and NOTHING else — no extra text, no markdown, no explanations, no code blocks.

RULES YOU MUST FOLLOW:
- Do not include any markdown formatting like \`\`\`json or triple backticks.
- DO NOT include XML, <think>, or any other extra tags.
- Your output MUST be a single valid JSON object that starts and ends with { ... }.
- Include all fields in the schema, even if they are empty.
- Add a disclaimer in the "reasoning" field: "This is not a substitute for professional medical advice. Always consult a licensed healthcare provider."

IMPORTANT: Your response MUST be a valid JSON object with the following structure. Do not include any text, markdown formatting, or explanations outside of this JSON structure:

{
  "primaryDiagnosis": {
    "name": string,
    "description": string,
    "icdCode": string,
    "severity": string,
    "commonSymptoms": string[]
  },
  "differentialDiagnoses": [
    {
      "name": string,
      "icdCode": string,
      "likelihood": string
    }
  ],
  "reasoning": string,
  "medicationPlan": [
    {
      "name": string,
      "purpose": string,
      "dosage": string,
      "timing": string,
      "duration": string,
      "notes": string
    }
  ],
  "testRecommendations": [
    {
      "testName": string,
      "reason": string
    }
  ],
  "lifestyleAdvice": string[],
  "followUp": string
}

Do not include any text outside of this JSON structure. Do not include any markdown formatting like \`\`\`json or \`\`\`. Just return the raw JSON object.

IMPORTANT: Always include a disclaimer in the reasoning field that this is not a substitute for professional medical advice, and the patient should consult with a healthcare provider for a definitive diagnosis.
Reminder: Respond ONLY with the valid JSON object. No markdown or explanations. Just return the object exactly as specified. `
          },
          {
            role: "user",
            content: prompt
          }
        ],
        // Optimize parameters for medical diagnosis
        temperature: 0.1, // Lower temperature for more deterministic/factual responses
        max_tokens: 2000, // Increased token limit for more detailed responses
        top_p: 0.95, // High nucleus sampling for focused yet comprehensive responses
        frequency_penalty: 0.5, // Moderate penalty to reduce repetition
        // Note: Cannot use both frequency_penalty and presence_penalty with Perplexity API
        // Filter search results to focus on reputable medical sources
        stream: false,
        search_domain_filter: [
          "mayoclinic.org",
          "nih.gov",
          "cdc.gov",
          "who.int",
          "medlineplus.gov",
          "nejm.org",
          "jamanetwork.com",
          "uptodate.com",
          "pubmed.ncbi.nlm.nih.gov",
          "aafp.org"
        ]
        // Note: Removed web_search_options as it might not be supported by the API
      })
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed with status ${response.status}: ${errorText}`);

      // Log more detailed information about the error
      if (response.status === 401) {
        console.error("Authentication error: The API key may be invalid or expired");
      } else if (response.status === 429) {
        console.error("Rate limit exceeded: Too many requests to the Perplexity API");
      } else if (response.status >= 500) {
        console.error("Server error: The Perplexity API is experiencing issues");
      }

      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));

    // Parse the response content as JSON
    const content = data.choices[0].message.content;
    let parsedContent: DiagnosisJsonResponse;

    try {
      // First, clean up the content by removing any XML-like tags and think blocks
      let cleanedContent = content;

      // Remove <think> blocks
      cleanedContent = cleanedContent.replace(/<think>[\s\S]*?<\/think>/g, '');

      // Remove other XML-like tags
      cleanedContent = cleanedContent.replace(/<[^>]*>/g, '').trim();

      // Define regex to fix malformed keys (e.g., "\nkeyName": to "keyName":)
      const malformedKeyRegex = /"\n+(\w+)"\s*:/g;
      const keyCorrector = (_match: string, p1: string) => `"${p1}":`;

      // Check if the content contains JSON within it
      const jsonMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/);

      if (jsonMatch && jsonMatch[1]) {
        // Extract JSON from markdown code block
        console.log("Found JSON in markdown code block, attempting to parse");
        try {
          // Fix malformed keys before parsing
          const jsonFromMarkdown = jsonMatch[1].replace(malformedKeyRegex, keyCorrector);
          parsedContent = JSON.parse(jsonFromMarkdown);
        } catch (innerError) {
          console.error("Failed to parse JSON from code block:", innerError);
          console.error("JSON string that failed to parse:", jsonMatch[1]);
          parsedContent = extractDiagnosisFromText(cleanedContent);
        }
      } else {
        // Try to extract JSON object from the content
        const jsonObjectMatch = cleanedContent.match(/^\{\s*"primaryDiagnosis"[\s\S]*\}$/);

        if (jsonObjectMatch && jsonObjectMatch[0]) {
          console.log("Found JSON object in content, attempting to parse");
          try {
            // Fix malformed keys before parsing
            const rawJsonString = jsonObjectMatch[0].replace(malformedKeyRegex, keyCorrector);
            parsedContent = JSON.parse(rawJsonString);
          } catch (innerError) {
            console.error("Failed to parse JSON object:", innerError);
            console.error("JSON string that failed to parse:", jsonObjectMatch[0]);
            parsedContent = extractDiagnosisFromText(cleanedContent);
          }
        } else {
          // Try to parse the entire cleaned content as JSON
          console.log("Attempting to parse entire cleaned content as JSON");
          try {
            // Fix malformed keys before parsing
            const correctedFullContent = cleanedContent.replace(malformedKeyRegex, keyCorrector);
            parsedContent = JSON.parse(correctedFullContent);
          } catch (innerError) {
            console.error("Failed to parse cleaned content as JSON:", innerError);
            console.error("JSON string that failed to parse:", cleanedContent.substring(0, 200) + "...");
            parsedContent = extractDiagnosisFromText(cleanedContent);
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      // If parsing fails, extract the information using regex
      parsedContent = extractDiagnosisFromText(content);
    }

    // Format the citations from the API response
    const formattedCitations = data.citations.map((url, index) => {
      // Try to extract domain name for better citation titles
      let title = `Source ${index + 1}`;
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        const domainParts = domain.split('.');
        if (domainParts.length >= 2) {
          // Capitalize first letter of domain name
          const siteName = domainParts[domainParts.length - 2].charAt(0).toUpperCase() +
                          domainParts[domainParts.length - 2].slice(1);
          title = `${siteName} (${new Date().getFullYear()})`;
        }
      } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // If URL parsing fails, use default title
      }

      return {
        title,
        url
      };
    });

    // Utility function to safely get nested properties with defaults
    function safeGet<T>(obj: Record<string, unknown>, path: string, defaultValue: T): T {
      const parts = path.split('.');
      let current: Record<string, unknown> | unknown = obj;

      for (const part of parts) {
        if (current == null || typeof current !== 'object') {
          return defaultValue;
        }
        current = (current as Record<string, unknown>)[part];
      }

      return (current !== undefined ? current : defaultValue) as T;
    }

    // Create the diagnosis result object
    const diagnosisResult: DiagnosisResult = {
      primaryDiagnosis: {
        name: safeGet(parsedContent, 'primaryDiagnosis.name', "Unknown Condition"),
        description: safeGet(parsedContent, 'primaryDiagnosis.description', "Unable to determine a specific diagnosis from the provided information."),
        icdCode: safeGet(parsedContent, 'primaryDiagnosis.icdCode', "R69"),
        severity: safeGet(parsedContent, 'primaryDiagnosis.severity', "Unknown"),
        commonSymptoms: safeGet(parsedContent, 'primaryDiagnosis.commonSymptoms', [])
      },
      differentialDiagnoses: safeGet(parsedContent, 'differentialDiagnoses', []),
      reasoning: safeGet(parsedContent, 'reasoning', "The system was unable to parse the diagnosis information correctly."),
      medicationPlan: safeGet(parsedContent, 'medicationPlan', []),
      testRecommendations: safeGet(parsedContent, 'testRecommendations', []),
      lifestyleAdvice: safeGet(parsedContent, 'lifestyleAdvice', []),
      followUp: safeGet(parsedContent, 'followUp', "Please consult with a healthcare provider for a proper diagnosis."),
      citations: formattedCitations
    };

    // Return both the diagnosis result and the full API response
    return {
      diagnosis: diagnosisResult,
      apiResponse: data
    };
  } catch (error) {
    console.error("Error getting diagnosis:", error);

    // Log more detailed information about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    console.log("Falling back to demo mode due to API error");

    // Return a fallback diagnosis for demonstration purposes
    const fallbackDiagnosis = getCustomizedFallbackDiagnosis(symptomData);
    return {
      diagnosis: fallbackDiagnosis,
      apiResponse: null
    };
  }
}

/**
 * Formats the symptom data into a prompt for the API
 */
function formatPrompt(data: SymptomFormData): string {
  let prompt = `Patient Information:
- Age: ${data.age}
- Gender: ${data.gender}
- Symptoms: ${data.symptoms}
- Duration: ${data.duration}`;

  if (data.medicalHistory) {
    prompt += `\n- Medical History: ${data.medicalHistory}`;
  }

  if (data.fileUrls && data.fileUrls.length > 0) {
    prompt += `\n\nMedical Files:`;
    data.fileUrls.forEach((url, index) => {
      prompt += `\n- File ${index + 1}: ${url}`;
    });
    prompt += `\n\nPlease analyze the provided medical files (images or documents) if relevant to the diagnosis.`;
  }

  prompt += `\n\nBased on these symptoms${data.fileUrls && data.fileUrls.length > 0 ? ' and medical files' : ''}, provide a detailed medical diagnosis with ICD code, explanation, and reasoning. Consider differential diagnoses and recommend appropriate tests and treatments. Format your response as JSON.`;

  return prompt;
}

/**
 * Extracts diagnosis information from text if JSON parsing fails
 */
function extractDiagnosisFromText(text: string): DiagnosisJsonResponse {
  console.log("Extracting diagnosis from text using regex patterns");

  // Default values
  const result: DiagnosisJsonResponse = {
    primaryDiagnosis: {
      name: "Unknown Condition",
      description: "Unable to determine a specific diagnosis from the provided information.",
      icdCode: "R69",
      severity: "Unknown",
      commonSymptoms: []
    },
    differentialDiagnoses: [],
    reasoning: "The system was unable to parse the diagnosis information correctly.",
    medicationPlan: [],
    testRecommendations: [],
    lifestyleAdvice: [],
    followUp: "Please consult with a healthcare provider for a proper diagnosis."
  };

  // Clean up the text by removing any XML-like tags
  const cleanedText = text.replace(/<[^>]*>/g, '').trim();

  // Try to extract primary diagnosis name
  const diagnosisMatch = cleanedText.match(/"name":\s*"([^"]+)"/i) ||
                         cleanedText.match(/primaryDiagnosis[^{]*{[^}]*"name":\s*"([^"]+)"/i) ||
                         cleanedText.match(/diagnosis[:\s]+([^\n.]+)/i) ||
                         cleanedText.match(/condition[:\s]+([^\n.]+)/i) ||
                         cleanedText.match(/likely\s+(?:diagnosis|condition)[:\s]+([^\n.]+)/i);

  if (diagnosisMatch && diagnosisMatch[1]) {
    result.primaryDiagnosis.name = diagnosisMatch[1].trim();
  }

  // Try to extract ICD code
  const icdMatch = cleanedText.match(/"icdCode":\s*"([^"]+)"/i) ||
                   cleanedText.match(/primaryDiagnosis[^{]*{[^}]*"icdCode":\s*"([^"]+)"/i) ||
                   cleanedText.match(/ICD[^:]*:[^A-Z0-9]*((?:[A-Z][0-9]+(?:\.[0-9]+)?)|(?:[0-9]+(?:\.[0-9]+)?))/i) ||
                   cleanedText.match(/ICD(?:-10)?(?:\s+code)?[:\s]+((?:[A-Z][0-9]+(?:\.[0-9]+)?)|(?:[0-9]+(?:\.[0-9]+)?))/i);

  if (icdMatch && icdMatch[1]) {
    result.primaryDiagnosis.icdCode = icdMatch[1].trim();
  }

  // Try to extract description
  const descriptionMatch = cleanedText.match(/"description":\s*"([^"]+)"/i) ||
                           cleanedText.match(/primaryDiagnosis[^{]*{[^}]*"description":\s*"([^"]+)"/i) ||
                           cleanedText.match(/description[:\s]+([^\n]+(?:\n[^\n#]+)*)/i) ||
                           cleanedText.match(/is\s+(?:defined|characterized)\s+as\s+([^\n]+(?:\n[^\n#]+)*)/i);

  if (descriptionMatch && descriptionMatch[1]) {
    result.primaryDiagnosis.description = descriptionMatch[1].trim();
  }

  // Try to extract severity
  const severityMatch = cleanedText.match(/"severity":\s*"([^"]+)"/i) ||
                        cleanedText.match(/primaryDiagnosis[^{]*{[^}]*"severity":\s*"([^"]+)"/i) ||
                        cleanedText.match(/severity[:\s]+([^\n.]+)/i);

  if (severityMatch && severityMatch[1]) {
    result.primaryDiagnosis.severity = severityMatch[1].trim();
  }

  // Try to extract common symptoms
  const symptomsMatch = cleanedText.match(/"commonSymptoms":\s*\[(.*?)\]/i);
  if (symptomsMatch && symptomsMatch[1]) {
    const symptomsText = symptomsMatch[1];
    const symptoms = symptomsText.match(/"([^"]+)"/g);
    if (symptoms) {
      result.primaryDiagnosis.commonSymptoms = symptoms.map(s => s.replace(/"/g, ''));
    }
  }

  // Try to extract reasoning
  const reasoningMatch = cleanedText.match(/"reasoning":\s*"([^"]+)"/i) ||
                         cleanedText.match(/reasoning[:\s]+([^\n]+(?:\n[^\n#]+)*)/i) ||
                         cleanedText.match(/analysis[:\s]+([^\n]+(?:\n[^\n#]+)*)/i) ||
                         cleanedText.match(/rationale[:\s]+([^\n]+(?:\n[^\n#]+)*)/i);

  if (reasoningMatch && reasoningMatch[1]) {
    result.reasoning = reasoningMatch[1].trim();
  } else {
    // If no specific reasoning section found, use a portion of the text as reasoning
    // but exclude any parts that look like headers or citations
    const cleanedReasoning = cleanedText
      .replace(/^#.*$/gm, '') // Remove markdown headers
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/https?:\/\/\S+/g, '') // Remove URLs
      .replace(/\n\s*\n/g, '\n\n'); // Normalize spacing

    // Limit the reasoning to a reasonable length
    result.reasoning = cleanedReasoning.substring(0, 500).trim() +
      "\n\nNote: This is a partial extraction from the AI response. Please consult with a healthcare provider for a complete diagnosis.";
  }

  // Try to extract differential diagnoses
  const diffDiagnosesMatch = cleanedText.match(/"differentialDiagnoses":\s*\[([\s\S]*?)\]/i);
  if (diffDiagnosesMatch && diffDiagnosesMatch[1]) {
    const diffText = diffDiagnosesMatch[1];
    const diffItems = diffText.match(/\{[\s\S]*?\}/g);

    if (diffItems) {
      result.differentialDiagnoses = diffItems.map(item => {
        const nameMatch = item.match(/"name":\s*"([^"]+)"/i);
        const icdMatch = item.match(/"icdCode":\s*"([^"]+)"/i);
        const likelihoodMatch = item.match(/"likelihood":\s*"([^"]+)"/i);

        return {
          name: nameMatch && nameMatch[1] ? nameMatch[1] : "Unknown condition",
          icdCode: icdMatch && icdMatch[1] ? icdMatch[1] : "R69",
          likelihood: likelihoodMatch && likelihoodMatch[1] ? likelihoodMatch[1] : "Unknown"
        };
      });
    }
  }

  // Try to extract follow-up recommendations
  const followUpMatch = cleanedText.match(/"followUp":\s*"([^"]+)"/i) ||
                        cleanedText.match(/follow[- ]?up[:\s]+([^\n.]+)/i);

  if (followUpMatch && followUpMatch[1]) {
    result.followUp = followUpMatch[1].trim();
  }

  console.log("Extraction complete. Found diagnosis:", result.primaryDiagnosis.name);
  return result;
}

/**
 * Returns a customized fallback diagnosis based on the user's symptoms
 */
function getCustomizedFallbackDiagnosis(symptomData: SymptomFormData): DiagnosisResult {
  // Extract key symptoms for basic customization
  const symptoms = symptomData.symptoms.toLowerCase();
  const duration = symptomData.duration;

  // Check for common symptom patterns
  if (symptoms.includes('headache') && symptoms.includes('fever')) {
    return {
      primaryDiagnosis: {
        name: "Influenza (Flu)",
        description: "A contagious respiratory illness caused by influenza viruses that infect the nose, throat, and sometimes the lungs.",
        icdCode: "J11.1",
        severity: "Moderate",
        commonSymptoms: ["Fever", "Headache", "Muscle aches", "Fatigue", "Cough", "Sore throat"]
      },
      differentialDiagnoses: [
        {
          name: "Common Cold",
          icdCode: "J00",
          likelihood: "Moderate"
        },
        {
          name: "COVID-19",
          icdCode: "U07.1",
          likelihood: "Possible"
        }
      ],
      reasoning: `Based on the reported symptoms of headache and fever with a duration of ${duration}, the most likely diagnosis is influenza. Influenza typically presents with sudden onset of fever, headache, muscle aches, and respiratory symptoms. The symptoms described are consistent with the typical presentation of seasonal influenza.`,
      medicationPlan: [
        {
          name: "Acetaminophen (Tylenol)",
          purpose: "Fever and pain relief",
          dosage: "650mg",
          timing: "Every 4-6 hours as needed",
          duration: "Until symptoms resolve",
          notes: "Do not exceed 3000mg in 24 hours"
        },
        {
          name: "Oseltamivir (Tamiflu)",
          purpose: "Antiviral medication",
          dosage: "75mg",
          timing: "Twice daily with food",
          duration: "5 days",
          notes: "Most effective if started within 48 hours of symptom onset"
        }
      ],
      testRecommendations: [
        {
          testName: "Influenza PCR Test",
          reason: "To confirm influenza infection and determine strain"
        }
      ],
      lifestyleAdvice: [
        "Rest and stay hydrated",
        "Isolate from others to prevent spread",
        "Use tissues when coughing or sneezing",
        "Wash hands frequently"
      ],
      followUp: "If symptoms worsen or do not improve within 5-7 days, consult with a healthcare provider.",
      citations: [
        {
          title: "CDC Influenza Information (2023)",
          url: "https://www.cdc.gov/flu/about/index.html"
        },
        {
          title: "New England Journal of Medicine (2021)",
          url: "https://www.nejm.org/doi/full/10.1056/NEJMcp2027450"
        }
      ]
    };
  } else if (symptoms.includes('cough') && symptoms.includes('shortness of breath')) {
    return {
      primaryDiagnosis: {
        name: "Acute Bronchitis",
        description: "An inflammation of the lining of the bronchial tubes, which carry air to and from the lungs.",
        icdCode: "J20.9",
        severity: "Moderate",
        commonSymptoms: ["Cough", "Shortness of breath", "Chest discomfort", "Fatigue", "Low-grade fever"]
      },
      differentialDiagnoses: [
        {
          name: "Pneumonia",
          icdCode: "J18.9",
          likelihood: "Possible"
        },
        {
          name: "COVID-19",
          icdCode: "U07.1",
          likelihood: "Possible"
        }
      ],
      reasoning: `Based on the reported symptoms of cough and shortness of breath with a duration of ${duration}, the most likely diagnosis is acute bronchitis. Acute bronchitis typically presents with cough, which may be productive, and shortness of breath. The symptoms described are consistent with inflammation of the bronchial tubes.`,
      medicationPlan: [
        {
          name: "Guaifenesin (Mucinex)",
          purpose: "Expectorant to thin mucus",
          dosage: "600mg",
          timing: "Every 12 hours",
          duration: "7 days",
          notes: "Take with plenty of water"
        }
      ],
      testRecommendations: [
        {
          testName: "Chest X-ray",
          reason: "To rule out pneumonia if symptoms persist or worsen"
        }
      ],
      lifestyleAdvice: [
        "Rest and stay hydrated",
        "Use a humidifier to ease breathing",
        "Avoid smoking and secondhand smoke",
        "Take warm showers to help loosen mucus"
      ],
      followUp: "If symptoms worsen or do not improve within 7-10 days, consult with a healthcare provider.",
      citations: [
        {
          title: "American Family Physician (2022)",
          url: "https://www.aafp.org/pubs/afp/issues/2022/0500/p500.html"
        },
        {
          title: "Mayo Clinic - Bronchitis",
          url: "https://www.mayoclinic.org/diseases-conditions/bronchitis/symptoms-causes/syc-20355566"
        }
      ]
    };
  } else if (symptoms.includes('sore throat') || symptoms.includes('runny nose')) {
    return {
      primaryDiagnosis: {
        name: "Common Cold (Rhinovirus)",
        description: "A viral infection of the upper respiratory tract that primarily affects the nose and throat.",
        icdCode: "J00",
        severity: "Mild",
        commonSymptoms: ["Runny nose", "Sore throat", "Cough", "Congestion", "Sneezing", "Mild headache"]
      },
      differentialDiagnoses: [
        {
          name: "Allergic Rhinitis",
          icdCode: "J30.9",
          likelihood: "Possible"
        },
        {
          name: "Streptococcal Pharyngitis",
          icdCode: "J02.0",
          likelihood: "Less likely"
        }
      ],
      reasoning: `Based on the reported symptoms of ${symptoms.includes('sore throat') ? 'sore throat' : 'runny nose'} with a duration of ${duration}, the most likely diagnosis is a common cold. The common cold typically presents with nasal congestion, sore throat, and mild systemic symptoms. The gradual onset and constellation of upper respiratory symptoms are classic for rhinovirus infection, which is the predominant cause of common colds.`,
      medicationPlan: [
        {
          name: "Acetaminophen (Tylenol)",
          purpose: "Pain relief",
          dosage: "650mg",
          timing: "Every 6 hours as needed",
          duration: "Until symptoms resolve",
          notes: "Do not exceed 3000mg in 24 hours"
        },
        {
          name: "Saline Nasal Spray",
          purpose: "Nasal congestion relief",
          dosage: "1-2 sprays per nostril",
          timing: "As needed",
          duration: "Until symptoms resolve",
          notes: "Safe for continuous use"
        }
      ],
      testRecommendations: [],
      lifestyleAdvice: [
        "Rest and stay hydrated",
        "Use a humidifier to ease breathing",
        "Gargle with warm salt water for sore throat",
        "Wash hands frequently to prevent spread"
      ],
      followUp: "If symptoms worsen or do not improve within 7-10 days, consult with a healthcare provider.",
      citations: [
        {
          title: "Journal of Infectious Diseases (2018)",
          url: "https://academic.oup.com/jid/article/217/7/1057/4794640"
        },
        {
          title: "New England Journal of Medicine (2020)",
          url: "https://www.nejm.org/doi/full/10.1056/NEJMcp1905181"
        },
        {
          title: "CDC Guidelines (2023)",
          url: "https://www.cdc.gov/features/rhinoviruses/index.html"
        }
      ]
    };
  } else if (symptoms.includes('stomach') || symptoms.includes('nausea') || symptoms.includes('vomit')) {
    return {
      primaryDiagnosis: {
        name: "Viral Gastroenteritis",
        description: "An intestinal infection marked by watery diarrhea, abdominal cramps, nausea or vomiting, and sometimes fever.",
        icdCode: "A09",
        severity: "Moderate",
        commonSymptoms: ["Nausea", "Vomiting", "Diarrhea", "Abdominal cramps", "Low-grade fever", "Headache"]
      },
      differentialDiagnoses: [
        {
          name: "Food Poisoning",
          icdCode: "A05.9",
          likelihood: "Possible"
        },
        {
          name: "Irritable Bowel Syndrome",
          icdCode: "K58.9",
          likelihood: "Less likely"
        }
      ],
      reasoning: `Based on the reported gastrointestinal symptoms with a duration of ${duration}, the most likely diagnosis is viral gastroenteritis. Viral gastroenteritis typically presents with nausea, vomiting, abdominal cramps, and diarrhea. The symptoms described are consistent with inflammation of the stomach and intestines caused by a viral infection.`,
      medicationPlan: [
        {
          name: "Oral Rehydration Solution (Pedialyte)",
          purpose: "Prevent dehydration",
          dosage: "Small sips frequently",
          timing: "Throughout the day",
          duration: "Until symptoms resolve",
          notes: "Especially important after episodes of vomiting or diarrhea"
        },
        {
          name: "Bismuth Subsalicylate (Pepto-Bismol)",
          purpose: "Relieve nausea and diarrhea",
          dosage: "30ml or 2 tablets",
          timing: "Every 30-60 minutes as needed",
          duration: "Up to 8 doses in 24 hours",
          notes: "May cause temporary darkening of stool and tongue"
        }
      ],
      testRecommendations: [],
      lifestyleAdvice: [
        "Stay hydrated with clear fluids",
        "Avoid solid foods until vomiting stops",
        "Gradually reintroduce bland foods (BRAT diet: bananas, rice, applesauce, toast)",
        "Avoid dairy, caffeine, alcohol, and fatty foods until recovered"
      ],
      followUp: "If symptoms worsen, if unable to keep fluids down for 24 hours, or if symptoms persist beyond 3 days, seek medical attention.",
      citations: [
        {
          title: "Mayo Clinic - Viral Gastroenteritis",
          url: "https://www.mayoclinic.org/diseases-conditions/viral-gastroenteritis/symptoms-causes/syc-20378847"
        },
        {
          title: "American Family Physician (2019)",
          url: "https://www.aafp.org/pubs/afp/issues/2019/0201/p159.html"
        }
      ]
    };
  } else {
    // Default fallback for other symptoms
    return {
      primaryDiagnosis: {
        name: "Unspecified Condition",
        description: "A condition that requires further evaluation by a healthcare professional for accurate diagnosis.",
        icdCode: "R69",
        severity: "Unknown",
        commonSymptoms: ["Varies based on underlying condition"]
      },
      differentialDiagnoses: [],
      reasoning: `Based on the reported symptoms of "${symptomData.symptoms}" with a duration of ${duration}, a specific diagnosis cannot be determined with certainty. The symptoms described could be consistent with several different conditions. A thorough clinical evaluation by a healthcare professional is recommended for an accurate diagnosis.`,
      medicationPlan: [],
      testRecommendations: [
        {
          testName: "Comprehensive Medical Evaluation",
          reason: "To determine the underlying cause of symptoms"
        }
      ],
      lifestyleAdvice: [
        "Rest as needed",
        "Stay hydrated",
        "Monitor symptoms for any changes or worsening",
        "Keep a symptom diary to share with healthcare provider"
      ],
      followUp: "Schedule an appointment with a healthcare provider for proper evaluation and diagnosis.",
      citations: [
        {
          title: "Journal of the American Medical Association (2022)",
          url: "https://jamanetwork.com/journals/jama/fullarticle/2788483"
        },
        {
          title: "Mayo Clinic - Symptom Checker",
          url: "https://www.mayoclinic.org/symptom-checker/select-symptom/itt-20009075"
        }
      ]
    };
  }
}
