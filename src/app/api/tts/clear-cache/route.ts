import { NextRequest, NextResponse } from 'next/server';
import { clearTTSCacheForTexts, clearAllTTSCache } from '@/lib/tts-cache';

/**
 * API route for clearing TTS cache
 * POST: Clear cache for specific texts
 * DELETE: Clear all cache entries
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texts, voice = 'tt-en_us_001' } = body;

    // Validate the request
    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({
        error: 'Texts array is required'
      }, { status: 400 });
    }

    const result = await clearTTSCacheForTexts(texts, voice);
    
    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to clear TTS cache',
        details: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared ${result.deletedCount} TTS cache entries for ${texts.length} texts`
    });
  } catch (error) {
    console.error('Clear TTS cache API error:', error);
    return NextResponse.json({
      error: 'Failed to clear TTS cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await clearAllTTSCache();
    
    if (!result.success) {
      return NextResponse.json({
        error: 'Failed to clear all TTS cache',
        details: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared all ${result.deletedCount} TTS cache entries`
    });
  } catch (error) {
    console.error('Clear all TTS cache API error:', error);
    return NextResponse.json({
      error: 'Failed to clear all TTS cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
