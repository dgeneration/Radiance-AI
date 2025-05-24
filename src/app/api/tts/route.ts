import { NextRequest, NextResponse } from 'next/server';
import { getTTSFromCache, saveTTSToCache } from '@/lib/tts-cache';

/**
 * API route for Text-to-Speech conversion
 * Handles chunking of long text and converts to audio using TTS service
 * Now includes caching to avoid regenerating the same audio
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, voice = 'tt-en_us_001' } = body;

    // Validate the request
    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        error: 'Text is required and must be a string'
      }, { status: 400 });
    }

    // Check cache first
    const cacheResult = await getTTSFromCache(text, voice);

    if (cacheResult.success && cacheResult.fromCache) {
      return NextResponse.json({
        success: true,
        totalChunks: cacheResult.textChunks?.length || 0,
        successfulChunks: cacheResult.audioChunks?.length || 0,
        failedChunks: 0,
        failedChunkIndices: [],
        textChunks: cacheResult.textChunks || [],
        audioChunks: cacheResult.audioChunks || [],
        wordCounts: cacheResult.wordCounts || [],
        fromCache: true,
        message: `Retrieved ${cacheResult.audioChunks?.length || 0} cached audio chunks.`
      });
    }

    if (!cacheResult.success) {
      console.warn('Cache check failed:', cacheResult.error);
      // Continue with generation if cache check fails
    }

    // Function to chunk text into smaller pieces (max 300 characters)
    const chunkText = (text: string, maxLength: number = 300): string[] => {
      const chunks: string[] = [];
      let currentChunk = '';

      // Split by sentences first to maintain natural breaks
      const sentences = text.split(/(?<=[.!?])\s+/);

      for (const sentence of sentences) {
        // If adding this sentence would exceed the limit
        if (currentChunk.length + sentence.length > maxLength) {
          // If we have a current chunk, add it to chunks
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }

          // If the sentence itself is too long, split it by words
          if (sentence.length > maxLength) {
            const words = sentence.split(' ');
            for (const word of words) {
              if (currentChunk.length + word.length + 1 > maxLength) {
                if (currentChunk.trim()) {
                  chunks.push(currentChunk.trim());
                  currentChunk = '';
                }
              }
              currentChunk += (currentChunk ? ' ' : '') + word;
            }
          } else {
            currentChunk = sentence;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      // Add the last chunk if it exists
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      return chunks;
    };

    // Chunk the text
    const textChunks = chunkText(text);

    // Function to convert a single chunk to audio
    const convertChunkToAudio = async (chunk: string): Promise<string | null> => {
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

        // Check if the response is successful and contains audio data
        if (result.type === 'success' && result.data) {
          let audioData = null;

          // Handle case where data is a JSON string
          if (typeof result.data === 'string') {
            try {
              const parsedData = JSON.parse(result.data);

              if (Array.isArray(parsedData) && parsedData.length >= 3) {
                audioData = parsedData[2];
              }
            } catch (parseError) {
              return null;
            }
          }
          // Handle case where data is already an array
          else if (Array.isArray(result.data) && result.data.length >= 3) {
            audioData = result.data[2];
          }

          if (audioData && typeof audioData === 'string' && audioData.length > 0) {
            return audioData;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    };

    // Convert all chunks to audio
    const audioChunks: string[] = [];
    const failedChunks: number[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      const audioData = await convertChunkToAudio(chunk);

      if (audioData) {
        audioChunks.push(audioData);
      } else {
        failedChunks.push(i);
      }

      // Add a small delay between requests to avoid rate limiting
      if (i < textChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Calculate word counts for each text chunk
    const wordCounts = textChunks.map(chunk =>
      chunk.split(/\s+/).filter(word => word.length > 0).length
    );

    // Save to cache if generation was successful
    if (audioChunks.length > 0 && failedChunks.length === 0) {
      await saveTTSToCache(text, audioChunks, textChunks, wordCounts, voice);
    }

    // Return the results
    return NextResponse.json({
      success: true,
      totalChunks: textChunks.length,
      successfulChunks: audioChunks.length,
      failedChunks: failedChunks.length,
      failedChunkIndices: failedChunks,
      textChunks,
      audioChunks,
      wordCounts,
      fromCache: false,
      message: failedChunks.length > 0
        ? `Converted ${audioChunks.length}/${textChunks.length} chunks successfully. ${failedChunks.length} chunks failed.`
        : `Successfully converted all ${audioChunks.length} chunks to audio.`
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to convert text to speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
