import { NextRequest, NextResponse } from 'next/server';
import { MedicalAnalystResponse } from '@/types/chain-diagnosis';

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
  }[];
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

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let medicalReport;
    try {
      const body = await request.json();
      medicalReport = body.medicalReport;
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!medicalReport) {
      return NextResponse.json(
        { error: 'Medical report is required' },
        { status: 400 }
      );
    }

    // Enhanced system prompt for Medical Analyst
    const systemPrompt = `You are the Medical Analyst AI at Radiance AI. Your primary role is to analyze uploaded medical test reports (text-based or descriptions of images) provided in the user input.

You are analyzing a medical report with the following details:
- Report Type: Medical Report

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
      medical_report: {
        text: medicalReport
      }
    }, null, 2);

    // Make the API request
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.error('Perplexity API key is not configured');

      // Return a mock response for testing purposes
      const mockResponse: MedicalAnalystResponse = {
        role_name: "Medical Analyst AI (Radiance AI) - MOCK",
        report_type_analyzed: "Laboratory Report",
        key_findings_from_report: [
          "Glucose level is elevated at 110 mg/dL (Reference: 70-99 mg/dL)",
          "LDL cholesterol is elevated at 120 mg/dL (Reference: <100 mg/dL)",
          "Other blood parameters are within normal ranges",
          "Patient has been diagnosed with prediabetic condition",
          "Patient has elevated LDL cholesterol"
        ],
        abnormalities_highlighted: [
          "Glucose: 110 mg/dL - ELEVATED (Reference: 70-99 mg/dL)",
          "LDL: 120 mg/dL - ELEVATED (Reference: <100 mg/dL)"
        ],
        clinical_correlation_points_for_gp: [
          "Elevated glucose levels (110 mg/dL) indicate prediabetes, requiring lifestyle modifications and possible medication",
          "Elevated LDL cholesterol (120 mg/dL) suggests increased cardiovascular risk, requiring dietary changes and possible statin therapy",
          "Consider evaluating for metabolic syndrome given the combination of glucose and lipid abnormalities",
          "Recommend HbA1c test to assess long-term glucose control"
        ],
        disclaimer: "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment. THIS IS A MOCK RESPONSE FOR TESTING PURPOSES.",
        reference_data_for_next_role: {
          analyst_summary: "Laboratory findings show elevated glucose (110 mg/dL) and LDL cholesterol (120 mg/dL) levels, indicating prediabetes and hyperlipidemia. Other parameters are within normal ranges.",
          raw_findings_ref: medicalReport.substring(0, 500)
        }
      };

      return NextResponse.json(mockResponse);
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
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
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API request failed with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const perplexityResponse: PerplexityResponse = await response.json();
    const content = perplexityResponse.choices[0].message.content;

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
        parsedResponse.report_type_analyzed = 'Medical Report';
      }

    } catch (error) {
      console.error('Error parsing Medical Analyst response:', error);

      // Create a fallback response
      parsedResponse = {
        role_name: "Medical Analyst AI (Radiance AI)",
        report_type_analyzed: 'Medical Report',
        key_findings_from_report: ["Unable to extract structured findings from the report"],
        abnormalities_highlighted: [],
        clinical_correlation_points_for_gp: ["Please review the raw report text directly"],
        disclaimer: "This analysis is provided for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.",
        reference_data_for_next_role: {
          analyst_summary: "The Medical Analyst AI was unable to properly analyze the report. Please refer to the original report text.",
          raw_findings_ref: medicalReport.substring(0, 500) + (medicalReport.length > 500 ? '...' : '')
        }
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error in test-medical-analyst API:', error);

    // Create a mock response for testing purposes
    const mockResponse: MedicalAnalystResponse = {
      role_name: "Medical Analyst AI (Radiance AI) - ERROR FALLBACK",
      report_type_analyzed: "Error Analysis",
      key_findings_from_report: [
        "Unable to process the medical report due to an error",
        "This is a fallback response for testing purposes"
      ],
      abnormalities_highlighted: [],
      clinical_correlation_points_for_gp: [
        "Please try again with a different medical report",
        "If the error persists, contact support"
      ],
      disclaimer: "This is a fallback response due to an error. This analysis is provided for informational purposes only and is not a substitute for professional medical advice.",
      reference_data_for_next_role: {
        analyst_summary: "Error occurred during analysis. This is a fallback response.",
        raw_findings_ref: error instanceof Error ? error.message : 'An unknown error occurred'
      }
    };

    // Log the error but return a mock response for testing
    return NextResponse.json(mockResponse);
  }
}
