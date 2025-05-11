import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if the API key is set
    const apiKey = process.env.PERPLEXITY_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // Don't return the actual API key for security reasons
    return NextResponse.json({
      success: true,
      apiKeySet: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 5) : null,
      apiUrl: apiUrl || 'Not set'
    });
  } catch (error) {
    console.error('Error in test-env route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}
