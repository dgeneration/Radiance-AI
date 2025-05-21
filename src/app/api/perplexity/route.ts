import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for making Perplexity API requests
 * This is needed because we can't expose the API key to the client
 */
export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables (with fallback)
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        error: 'Perplexity API key is not configured'
      }, { status: 500 });
    }

    // Parse the request body
    const body = await request.json();
    const { model, systemPrompt, userPrompt, streaming, hasImageUrl, chatHistory } = body;

    // Validate the request
    if (!model || !systemPrompt || (!userPrompt && !chatHistory)) {
      return NextResponse.json({
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    // Log request details for debugging
    console.log('API Request:', {
      model,
      streaming,
      hasImageUrl,
      chatHistoryLength: chatHistory ? chatHistory.length : 0,
      userPromptLength: typeof userPrompt === 'string' ? userPrompt.length : 'not a string'
    });



    // Prepare the request body
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
        max_tokens: 4000,
        stream: streaming
      };
    } else if (chatHistory && chatHistory.length > 0) {
      // For chat-based requests with history
      console.log('Using chat history with', chatHistory.length, 'messages');

      // Create messages array with system prompt and chat history
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add chat history messages
      chatHistory.forEach((msg: { role: string; content: string }) => {
        messages.push(msg);
      });

      requestBody = {
        model,
        messages,
        temperature: 0.1,
        max_tokens: 4000,
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
        max_tokens: 4000,
        stream: streaming
      };
    }

    // Get the API URL from environment variables (with fallback)
    const apiUrl = process.env.PERPLEXITY_API_URL || process.env.NEXT_PUBLIC_PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions';

    // Make the API request
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('API request timed out after 25 seconds'));
      }, 25000); // 25 second timeout
    });

    // Race the API request against the timeout
    const perplexityResponse = await Promise.race([
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      }),
      timeoutPromise
    ]) as Response;

    // Handle streaming responses
    if (streaming && perplexityResponse.body) {
      // Return the stream directly
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          // Pass through the chunk as-is
          controller.enqueue(chunk);
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
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}
