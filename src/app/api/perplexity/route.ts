import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for making Perplexity API requests
 * This is needed because we can't expose the API key to the client
 */
export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.error('Perplexity API key is not configured');
      return NextResponse.json({
        error: 'Perplexity API key is not configured'
      }, { status: 500 });
    }

    // Parse the request body
    const body = await request.json();
    const { model, systemPrompt, userPrompt, streaming, hasImageUrl } = body;

    // Validate the request
    if (!model || !systemPrompt || !userPrompt) {
      return NextResponse.json({
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    console.log(`Making Perplexity API request with model: ${model}`);
    console.log(`API Key prefix: ${apiKey.substring(0, 5)}...`);
    console.log(`Streaming mode: ${streaming ? 'enabled' : 'disabled'}`);
    console.log(`Has image URL: ${hasImageUrl ? 'yes' : 'no'}`);

    // Prepare the request body
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
        max_tokens: 4000,
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
        max_tokens: 4000,
        stream: streaming
      };
    }

    // Make the API request
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Handle streaming responses
    if (streaming && perplexityResponse.body) {
      console.log('Server: Streaming response received from Perplexity API');

      // Return the stream directly
      const transformStream = new TransformStream({
        start() {
          console.log('Server: Transform stream started');
        },
        transform(chunk, controller) {
          // Pass through the chunk as-is
          controller.enqueue(chunk);
        },
        flush() {
          console.log('Server: Transform stream complete');
        }
      });

      // Pipe the response body through the transform stream
      perplexityResponse.body.pipeTo(transformStream.writable);

      // Return the readable side of the transform stream
      return new Response(transformStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Check if the response is successful
    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);

      return NextResponse.json({
        error: `Perplexity API error: ${perplexityResponse.status}`,
        details: errorText
      }, { status: perplexityResponse.status });
    }

    // Parse the response
    const data = await perplexityResponse.json();

    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Perplexity API route:', error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}
