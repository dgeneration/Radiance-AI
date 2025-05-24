import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TTSCacheEntry {
  id: string;
  text_hash: string;
  original_text: string;
  audio_chunks: string[];
  text_chunks: string[];
  word_counts: number[];
  voice: string;
  created_at: string;
  updated_at: string;
}

export interface TTSCacheResult {
  success: boolean;
  audioChunks?: string[];
  textChunks?: string[];
  wordCounts?: number[];
  fromCache?: boolean;
  error?: string;
}

/**
 * Generate a hash for the text content to use as cache key
 */
function generateTextHash(text: string, voice: string = 'tt-en_us_001'): string {
  return crypto
    .createHash('sha256')
    .update(`${text}:${voice}`)
    .digest('hex');
}

/**
 * Check if TTS audio is cached for the given text
 */
export async function getTTSFromCache(text: string, voice: string = 'tt-en_us_001'): Promise<TTSCacheResult> {
  try {
    const textHash = generateTextHash(text, voice);

    const { data, error } = await supabase
      .from('tts_audio_cache')
      .select('*')
      .eq('text_hash', textHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not cached
        return { success: true, fromCache: false };
      }
      return { success: false, error: error.message };
    }

    if (data) {
      return {
        success: true,
        audioChunks: data.audio_chunks,
        textChunks: data.text_chunks,
        wordCounts: data.word_counts,
        fromCache: true
      };
    }

    return { success: true, fromCache: false };
  } catch (error) {
    console.error('Error in getTTSFromCache:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Save TTS audio to cache
 */
export async function saveTTSToCache(
  text: string,
  audioChunks: string[],
  textChunks: string[],
  wordCounts: number[],
  voice: string = 'tt-en_us_001'
): Promise<{ success: boolean; error?: string }> {
  try {
    const textHash = generateTextHash(text, voice);

    const { error } = await supabase
      .from('tts_audio_cache')
      .upsert({
        text_hash: textHash,
        original_text: text,
        audio_chunks: audioChunks,
        text_chunks: textChunks,
        word_counts: wordCounts,
        voice: voice,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'text_hash'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Clean up old TTS cache entries (optional - for maintenance)
 */
export async function cleanupTTSCache(olderThanDays: number = 30): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('tts_audio_cache')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up TTS cache:', error);
      return { success: false, error: error.message };
    }

    const deletedCount = data?.length || 0;
    console.log(`Cleaned up ${deletedCount} old TTS cache entries`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in cleanupTTSCache:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Clear TTS cache for specific text content
 */
export async function clearTTSCacheForTexts(texts: string[], voice: string = 'tt-en_us_001'): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    if (texts.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Generate hashes for all texts
    const textHashes = texts.map(text => generateTextHash(text, voice));

    const { data, error } = await supabase
      .from('tts_audio_cache')
      .delete()
      .in('text_hash', textHashes)
      .select('id');

    if (error) {
      return { success: false, error: error.message };
    }

    const deletedCount = data?.length || 0;
    return { success: true, deletedCount };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Clear all TTS cache entries (use with caution)
 */
export async function clearAllTTSCache(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tts_audio_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all entries
      .select('id');

    if (error) {
      console.error('Error clearing all TTS cache:', error);
      return { success: false, error: error.message };
    }

    const deletedCount = data?.length || 0;
    console.log(`Cleared all ${deletedCount} TTS cache entries`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in clearAllTTSCache:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get cache statistics
 */
export async function getTTSCacheStats(): Promise<{
  success: boolean;
  totalEntries?: number;
  totalSizeKB?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('tts_audio_cache')
      .select('audio_chunks, text_chunks');

    if (error) {
      console.error('Error getting TTS cache stats:', error);
      return { success: false, error: error.message };
    }

    const totalEntries = data?.length || 0;
    let totalSizeKB = 0;

    if (data) {
      for (const entry of data) {
        // Estimate size based on base64 audio chunks
        const audioSize = entry.audio_chunks.reduce((sum: number, chunk: string) => sum + chunk.length, 0);
        const textSize = JSON.stringify(entry.text_chunks).length;
        totalSizeKB += (audioSize + textSize) / 1024;
      }
    }

    return {
      success: true,
      totalEntries,
      totalSizeKB: Math.round(totalSizeKB)
    };
  } catch (error) {
    console.error('Error in getTTSCacheStats:', error);
    return { success: false, error: String(error) };
  }
}
