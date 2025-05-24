/**
 * Audio utilities for handling TTS audio conversion and playback
 */

export interface AudioChunk {
  id: string;
  base64Data: string;
  audioUrl?: string;
  duration?: number;
  text?: string; // The text content for this chunk
  wordCount?: number; // Number of words in this chunk
}

export interface AudioQueueManager {
  chunks: AudioChunk[];
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  currentAudio?: HTMLAudioElement;
  onChunkStart?: (index: number) => void;
  onChunkEnd?: (index: number) => void;
  onQueueComplete?: () => void;
  onError?: (error: Error, index: number) => void;
  onWordProgress?: (chunkIndex: number, wordIndex: number, totalWords: number) => void;
  wordProgressInterval?: NodeJS.Timeout;
  currentWordIndex?: number; // Track current word position for pause/resume
  pausedAt?: number; // Track when audio was paused
}

/**
 * Convert base64 MPEG data to a playable audio URL
 */
export function base64ToAudioUrl(base64Data: string): string {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');

    // Convert base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob with MPEG audio type
    const blob = new Blob([bytes], { type: 'audio/mpeg' });

    // Create object URL
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error('Failed to convert audio data');
  }
}

/**
 * Create audio chunks from base64 data array
 */
export function createAudioChunks(base64DataArray: string[], textChunks?: string[]): AudioChunk[] {
  return base64DataArray.map((base64Data, index) => {
    const text = textChunks?.[index] || '';
    const wordCount = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;

    return {
      id: `chunk-${index}`,
      base64Data,
      audioUrl: base64ToAudioUrl(base64Data),
      text,
      wordCount
    };
  });
}

/**
 * Get audio duration from base64 data
 */
export function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);

    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });

    audio.addEventListener('error', (error) => {
      reject(new Error('Failed to load audio metadata'));
    });

    audio.load();
  });
}

/**
 * Create an audio queue manager for sequential playback
 */
export function createAudioQueueManager(
  audioChunks: AudioChunk[],
  callbacks?: {
    onChunkStart?: (index: number) => void;
    onChunkEnd?: (index: number) => void;
    onQueueComplete?: () => void;
    onError?: (error: Error, index: number) => void;
    onWordProgress?: (chunkIndex: number, wordIndex: number, totalWords: number) => void;
  }
): AudioQueueManager {
  const manager: AudioQueueManager = {
    chunks: audioChunks,
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    onChunkStart: callbacks?.onChunkStart,
    onChunkEnd: callbacks?.onChunkEnd,
    onQueueComplete: callbacks?.onQueueComplete,
    onError: callbacks?.onError,
    onWordProgress: callbacks?.onWordProgress
  };

  return manager;
}

/**
 * Play the next chunk in the queue
 */
export function playNextChunk(manager: AudioQueueManager): Promise<void> {
  return new Promise((resolve, reject) => {
    if (manager.currentIndex >= manager.chunks.length) {
      manager.isPlaying = false;
      manager.onQueueComplete?.();
      resolve();
      return;
    }

    const chunk = manager.chunks[manager.currentIndex];

    if (!chunk.audioUrl) {
      const error = new Error(`No audio URL for chunk ${manager.currentIndex}`);
      manager.onError?.(error, manager.currentIndex);
      reject(error);
      return;
    }

    const audio = new Audio(chunk.audioUrl);
    manager.currentAudio = audio;
    manager.isPlaying = true;
    manager.isPaused = false;

    // Notify chunk start
    console.log('Starting chunk:', {
      chunkIndex: manager.currentIndex,
      hasText: !!chunk.text,
      wordCount: chunk.wordCount,
      hasWordProgressCallback: !!manager.onWordProgress
    });

    manager.onChunkStart?.(manager.currentIndex);

    // Set up word progress tracking if callback is provided and chunk has text
    if (manager.onWordProgress && chunk.text && chunk.wordCount && chunk.wordCount > 0) {

      const startWordProgressTracking = () => {
        // Clear any existing interval
        if (manager.wordProgressInterval) {
          clearInterval(manager.wordProgressInterval);
        }

        // Use a simple time-based approach for word highlighting
        // Estimate words per second (typical speech rate is 150-200 words per minute)
        const wordsPerSecond = 2.5; // Conservative estimate
        const intervalMs = (1000 / wordsPerSecond);

        // Resume from where we left off, or start from beginning
        const startWordIndex = manager.currentWordIndex ?? 0;

        console.log('Starting word progress tracking:', {
          wordCount: chunk.wordCount,
          intervalMs,
          startWordIndex,
          chunkText: chunk.text?.substring(0, 50) + '...'
        });

        // Immediately highlight the current word
        manager.onWordProgress?.(manager.currentIndex, startWordIndex, chunk.wordCount!);
        let currentWordIndex = startWordIndex + 1;

        manager.wordProgressInterval = setInterval(() => {
          if (currentWordIndex < chunk.wordCount! && manager.isPlaying && !manager.isPaused) {
            console.log('Word progress update:', {
              chunkIndex: manager.currentIndex,
              wordIndex: currentWordIndex,
              totalWords: chunk.wordCount
            });
            manager.onWordProgress?.(manager.currentIndex, currentWordIndex, chunk.wordCount!);
            manager.currentWordIndex = currentWordIndex; // Save current position
            currentWordIndex++;
          } else {
            if (manager.wordProgressInterval) {
              clearInterval(manager.wordProgressInterval);
              manager.wordProgressInterval = undefined;
            }
          }
        }, intervalMs);
      };

      // Start tracking when audio actually starts playing
      audio.addEventListener('play', startWordProgressTracking);

      // Save position when paused
      audio.addEventListener('pause', () => {
        manager.pausedAt = Date.now();
        if (manager.wordProgressInterval) {
          clearInterval(manager.wordProgressInterval);
          manager.wordProgressInterval = undefined;
        }
      });
    }

    audio.addEventListener('ended', () => {
      // Clear word progress interval for current chunk
      if (manager.wordProgressInterval) {
        clearInterval(manager.wordProgressInterval);
        manager.wordProgressInterval = undefined;
      }

      manager.onChunkEnd?.(manager.currentIndex);
      const completedChunkIndex = manager.currentIndex;
      manager.currentIndex++;

      // Reset word position for next chunk
      manager.currentWordIndex = undefined;

      console.log('Chunk ended, moving to next:', {
        completedChunk: completedChunkIndex,
        nextChunk: manager.currentIndex,
        totalChunks: manager.chunks.length
      });

      // Play next chunk
      playNextChunk(manager)
        .then(resolve)
        .catch(reject);
    });

    audio.addEventListener('error', (error) => {
      // Clear word progress interval on error
      if (manager.wordProgressInterval) {
        clearInterval(manager.wordProgressInterval);
        manager.wordProgressInterval = undefined;
      }

      const audioError = new Error(`Failed to play chunk ${manager.currentIndex}`);
      manager.onError?.(audioError, manager.currentIndex);
      manager.isPlaying = false;
      reject(audioError);
    });

    // Start playing
    audio.play().catch((error) => {
      const playError = new Error(`Failed to start playing chunk ${manager.currentIndex}: ${error.message}`);
      manager.onError?.(playError, manager.currentIndex);
      manager.isPlaying = false;
      reject(playError);
    });
  });
}

/**
 * Start playing the audio queue
 */
export function playAudioQueue(manager: AudioQueueManager): Promise<void> {
  if (manager.isPlaying) {
    return Promise.resolve();
  }

  manager.currentIndex = 0;
  return playNextChunk(manager);
}

/**
 * Pause the current audio playback
 */
export function pauseAudioQueue(manager: AudioQueueManager): void {
  if (manager.currentAudio && manager.isPlaying) {
    manager.currentAudio.pause();
    manager.isPaused = true;
    manager.isPlaying = false;

    // Pause word progress tracking
    if (manager.wordProgressInterval) {
      clearInterval(manager.wordProgressInterval);
      manager.wordProgressInterval = undefined;
    }
  }
}

/**
 * Resume the current audio playback
 */
export function resumeAudioQueue(manager: AudioQueueManager): void {
  if (manager.currentAudio && manager.isPaused) {
    manager.currentAudio.play();
    manager.isPaused = false;
    manager.isPlaying = true;
  }
}

/**
 * Stop the audio queue and reset
 */
export function stopAudioQueue(manager: AudioQueueManager): void {
  if (manager.currentAudio) {
    manager.currentAudio.pause();
    manager.currentAudio.currentTime = 0;
  }

  // Clear word progress tracking
  if (manager.wordProgressInterval) {
    clearInterval(manager.wordProgressInterval);
    manager.wordProgressInterval = undefined;
  }

  manager.isPlaying = false;
  manager.isPaused = false;
  manager.currentIndex = 0;
  manager.currentWordIndex = undefined; // Reset word position
  manager.pausedAt = undefined;
}

/**
 * Clean up audio URLs to prevent memory leaks
 */
export function cleanupAudioChunks(chunks: AudioChunk[]): void {
  chunks.forEach(chunk => {
    if (chunk.audioUrl) {
      URL.revokeObjectURL(chunk.audioUrl);
    }
  });
}
