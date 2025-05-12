import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for testing streaming responses
 * This is a simple test endpoint that streams a response to the client
 */
export async function GET(request: NextRequest) {
  try {
    // Create a transform stream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Start streaming in the background
    streamResponse(writer).catch(error => {
      console.error('Error streaming response:', error);
    });
    
    // Return the readable side of the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in test-streaming route:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Stream a response to the client
 * @param writer The writer to write to
 */
async function streamResponse(writer: WritableStreamDefaultWriter) {
  const encoder = new TextEncoder();
  
  try {
    // Send a series of messages with delays
    for (let i = 1; i <= 10; i++) {
      // Create a message in the format expected by the client
      const message = {
        id: `msg-${i}`,
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'test-model',
        choices: [
          {
            index: 0,
            delta: {
              content: `This is message ${i} of the test stream.\n`
            },
            finish_reason: i === 10 ? 'stop' : null
          }
        ]
      };
      
      // Format as a server-sent event
      const data = `data: ${JSON.stringify(message)}\n\n`;
      await writer.write(encoder.encode(data));
      
      // Wait a bit before sending the next message
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Send the final [DONE] message
    await writer.write(encoder.encode('data: [DONE]\n\n'));
  } catch (error) {
    console.error('Error in streamResponse:', error);
  } finally {
    // Close the writer
    await writer.close();
  }
}
