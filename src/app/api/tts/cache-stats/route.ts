import { NextRequest, NextResponse } from 'next/server';
import { getTTSCacheStats, cleanupTTSCache, clearAllTTSCache } from '@/lib/tts-cache';

/**
 * API route for TTS cache management
 * GET: Get cache statistics
 * DELETE: Clean up old cache entries
 */

export async function GET(request: NextRequest) {
  try {
    const stats = await getTTSCacheStats();

    if (!stats.success) {
      return NextResponse.json({
        error: 'Failed to get cache statistics',
        details: stats.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalEntries: stats.totalEntries,
        totalSizeKB: stats.totalSizeKB,
        totalSizeMB: Math.round((stats.totalSizeKB || 0) / 1024 * 100) / 100
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get cache statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clearAll = url.searchParams.get('clearAll') === 'true';
    const olderThanDays = parseInt(url.searchParams.get('olderThanDays') || '30');

    let result;
    if (clearAll) {
      result = await clearAllTTSCache();
    } else {
      result = await cleanupTTSCache(olderThanDays);
    }

    if (!result.success) {
      return NextResponse.json({
        error: clearAll ? 'Failed to clear all cache' : 'Failed to cleanup cache',
        details: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: clearAll
        ? `Cleared all ${result.deletedCount} cache entries`
        : `Cleaned up ${result.deletedCount} cache entries older than ${olderThanDays} days`
    });
  } catch (error) {
    console.error('Cache cleanup API error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
