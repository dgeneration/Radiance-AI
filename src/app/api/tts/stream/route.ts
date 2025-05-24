import { NextRequest, NextResponse } from 'next/server';

// Function to split text into chunks of approximately 300 characters
function splitTextIntoChunks(text: string, maxChunkLength: number = 300): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    const sentenceWithPunctuation = trimmedSentence + '.';

    if (currentChunk.length + sentenceWithPunctuation.length <= maxChunkLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentenceWithPunctuation;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

// Function to convert a single chunk to audio
const convertChunkToAudio = async (chunk: string, voice: string): Promise<string | null> => {
  try {
    const formData = new URLSearchParams();
    formData.append('selectedVoiceValue', voice);
    formData.append('text', chunk);

    const response = await fetch('https://ttsvibes.com/?/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Origin': 'https://ttsvibes.com',
        'Referer': 'https://ttsvibes.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (result.type === 'success' && result.data) {
      let audioData = null;

      if (typeof result.data === 'string') {
        try {
          const parsedData = JSON.parse(result.data);
          if (Array.isArray(parsedData) && parsedData.length >= 3) {
            audioData = parsedData[2];
          }
        } catch (parseError) {
          return null;
        }
      } else if (Array.isArray(result.data) && result.data.length >= 3) {
        audioData = result.data[2];
      }

      if (audioData && typeof audioData === 'string' && audioData.length > 0) {
        return audioData;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'tt-en_us_001' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        error: 'Text is required and must be a string'
      }, { status: 400 });
    }

    // Split text into chunks
    const textChunks = splitTextIntoChunks(text);

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: 'metadata',
            totalChunks: textChunks.length,
            textChunks
          };
          controller.enqueue(`data: ${JSON.stringify(metadata)}\n\n`);

          // Process chunks in parallel but send them in order
          const chunkPromises = textChunks.map(async (chunk, index) => {
            const audioData = await convertChunkToAudio(chunk, voice);
            return { index, chunk, audioData };
          });

          // Send chunks as they complete
          for (let i = 0; i < chunkPromises.length; i++) {
            try {
              const result = await chunkPromises[i];

              const chunkData = {
                type: 'chunk',
                index: result.index,
                text: result.chunk,
                audioData: result.audioData,
                success: !!result.audioData
              };

              controller.enqueue(`data: ${JSON.stringify(chunkData)}\n\n`);

              // Small delay between chunks to avoid overwhelming the client
              if (i < chunkPromises.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            } catch (error) {
              const errorData = {
                type: 'chunk',
                index: i,
                text: textChunks[i],
                audioData: null,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
              controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
            }
          }

          // Send completion signal
          const completion = {
            type: 'complete',
            totalChunks: textChunks.length
          };
          controller.enqueue(`data: ${JSON.stringify(completion)}\n\n`);

        } catch (error) {
          const errorData = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          controller.enqueue(`data: ${JSON.stringify(errorData)}\n\n`);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process streaming TTS request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
