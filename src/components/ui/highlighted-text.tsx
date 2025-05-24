"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface HighlightedTextProps {
  text: string;
  currentChunkIndex?: number;
  currentWordIndex?: number;
  textChunks?: string[];
  chunkWordCounts?: number[];
  className?: string;
  highlightClassName?: string;
}

/**
 * Component that renders text with word-level highlighting for TTS playback
 */
export function HighlightedText({
  text,
  currentChunkIndex = -1,
  currentWordIndex = -1,
  textChunks = [],
  chunkWordCounts = [],
  className = "",
  highlightClassName = "bg-primary/20 text-primary rounded px-0.5"
}: HighlightedTextProps) {

  // Debug logging (can be removed in production)
  if (currentChunkIndex >= 0 && currentWordIndex >= 0) {
    console.log('HighlightedText highlighting:', {
      currentChunkIndex,
      currentWordIndex,
      textChunksLength: textChunks.length
    });
  }

  const renderedContent = useMemo(() => {
    console.log('HighlightedText rendering with:', {
      currentChunkIndex,
      currentWordIndex,
      textChunksLength: textChunks.length,
      firstChunk: textChunks[0]?.substring(0, 50)
    });

    // If no chunks are provided, split the text into words for basic highlighting
    if (textChunks.length === 0) {
      const words = text.split(/(\s+)/);
      return words.map((word, index) => {
        const isWord = word.trim().length > 0;
        const wordIndex = Math.floor(index / 2); // Account for spaces
        const isHighlighted = isWord && wordIndex === currentWordIndex && currentChunkIndex === 0;

        return (
          <span
            key={index}
            className={cn(
              isHighlighted ? highlightClassName : "",
              "transition-all duration-200"
            )}
          >
            {word}
          </span>
        );
      });
    }

    // When chunks are provided, render each chunk separately
    let globalWordIndex = 0;

    // Special case: if we have only one text chunk but multiple audio chunks are playing,
    // treat the single text chunk as if it contains all the content and highlight based on global word position
    if (textChunks.length === 1 && currentChunkIndex >= 0) {
      const words = textChunks[0].split(/(\s+)/);

      return words.map((word, index) => {
        const isWord = word.trim().length > 0;
        if (isWord) {
          const globalWordIndex = Math.floor(index / 2);

          // Calculate the global word position based on chunk word counts
          let globalWordPosition = currentWordIndex;
          if (chunkWordCounts.length > 0) {
            // Add up words from previous chunks
            for (let i = 0; i < currentChunkIndex; i++) {
              globalWordPosition += chunkWordCounts[i] || 0;
            }
          } else {
            // Fallback: use estimated words per chunk
            const estimatedWordsPerChunk = 25;
            globalWordPosition = (currentChunkIndex * estimatedWordsPerChunk) + currentWordIndex;
          }

          const isHighlighted = globalWordIndex === globalWordPosition && currentWordIndex >= 0;

          if (isHighlighted) {
            console.log('Highlighting word (single chunk mode):', {
              word: word.substring(0, 10),
              globalWordIndex,
              currentChunkIndex,
              currentWordIndex,
              globalWordPosition,
              chunkWordCounts: chunkWordCounts.slice(0, currentChunkIndex + 1)
            });
          }

          return (
            <span
              key={index}
              className={cn(
                isHighlighted ? highlightClassName : "",
                "transition-all duration-200"
              )}
            >
              {word}
            </span>
          );
        } else {
          return <span key={index}>{word}</span>;
        }
      });
    }

    return textChunks.map((chunk, chunkIndex) => {
      const words = chunk.split(/(\s+)/);

      const chunkContent = words.map((word, wordIndexInChunk) => {
        const isWord = word.trim().length > 0;

        if (isWord) {
          const localWordIndex = Math.floor(wordIndexInChunk / 2);
          const isHighlighted =
            chunkIndex === currentChunkIndex &&
            localWordIndex === currentWordIndex &&
            currentChunkIndex >= 0 &&
            currentWordIndex >= 0;

          if (isHighlighted) {
            console.log('Highlighting word:', {
              word: word.substring(0, 10),
              chunkIndex,
              localWordIndex
            });
          }

          return (
            <span
              key={`${chunkIndex}-${wordIndexInChunk}`}
              className={cn(
                isHighlighted ? highlightClassName : "",
                "transition-all duration-200"
              )}
            >
              {word}
            </span>
          );
        } else {
          return (
            <span key={`${chunkIndex}-${wordIndexInChunk}`}>
              {word}
            </span>
          );
        }
      });

      // Update global word index for next chunk
      const wordsInChunk = chunk.split(/\s+/).filter(w => w.length > 0).length;
      globalWordIndex += wordsInChunk;

      return (
        <span key={chunkIndex}>
          {chunkContent}
          {chunkIndex < textChunks.length - 1 && ' '}
        </span>
      );
    });
  }, [text, currentChunkIndex, currentWordIndex, textChunks, highlightClassName]);

  return (
    <div className={cn("leading-relaxed", className)}>
      {renderedContent}
    </div>
  );
}

/**
 * Hook to extract text chunks and calculate word positions
 */
export function useTextChunks(text: string, chunkTexts: string[]) {
  return useMemo(() => {
    if (chunkTexts.length === 0) {
      return {
        chunks: [text],
        totalWords: text.split(/\s+/).filter(w => w.length > 0).length
      };
    }

    const totalWords = chunkTexts.reduce((total, chunk) => {
      return total + chunk.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);

    return {
      chunks: chunkTexts,
      totalWords
    };
  }, [text, chunkTexts]);
}
