import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify the Perplexity API connection for Chain Diagnosis
 * This endpoint tests the API key and connection to the Perplexity API
 */
export async function GET(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    
    // Check if the API key is set
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Perplexity API key is not configured',
        environmentVariables: Object.keys(process.env).filter(key => key.includes('PERPLEXITY'))
      }, { status: 500 });
    }
    
    // Make a simple test request to the Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for testing API connectivity.'
          },
          {
            role: 'user',
            content: 'Please respond with a simple JSON object with the key "status" and value "connected" to verify the API connection is working.'
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    });
    
    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `API request failed with status ${response.status}: ${errorText}`,
        apiKeyPrefix: apiKey.substring(0, 5) + '...',
        apiKeyLength: apiKey.length
      }, { status: response.status });
    }
    
    // Parse the response
    const data = await response.json();
    
    // Return the response
    return NextResponse.json({
      success: true,
      apiConnected: true,
      apiKeyPrefix: apiKey.substring(0, 5) + '...',
      apiKeyLength: apiKey.length,
      model: data.model,
      responseContent: data.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in test-chain-diagnosis-api:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
