import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { processRadianceAI } from '@/lib/diagnosis-api';

// Flag to track if we've already checked for table existence
let tablesChecked = false;
let tablesExist = false;

/**
 * Check if the required tables exist in the database
 * @returns Whether the tables exist
 */
export async function checkTablesExist(): Promise<boolean> {
  if (tablesChecked) {
    return tablesExist;
  }

  try {
    const supabase = createClient();

    // Try to get the count of sessions
    const { count, error } = await supabase
      .from('standalone_radiance_chat_sessions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking for standalone_radiance_chat_sessions table:', error);
      tablesChecked = true;
      tablesExist = false;
      return false;
    }

    // If we got here, the table exists
    tablesChecked = true;
    tablesExist = true;
    return true;
  } catch (error) {
    console.error('Exception checking for tables:', error);
    tablesChecked = true;
    tablesExist = false;
    return false;
  }
}

// Define types for standalone chat
export interface StandaloneRadianceChatSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  is_active: boolean;
}

export interface StandaloneRadianceChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  raw_api_response?: Record<string, any> | null;
}

/**
 * Create a new standalone Ask Radiance AI chat session
 * @param userId The user ID
 * @returns The session ID
 */
export async function createStandaloneRadianceChatSession(userId: string): Promise<string | null> {
  try {
    if (!userId) {
      return null;
    }

    // Check if tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      return uuidv4(); // Return a generated ID for fallback
    }

    const sessionId = uuidv4();
    const supabase = createClient();

    const { error } = await supabase
      .from('standalone_radiance_chat_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        title: 'Ask Radiance AI Session',
        is_active: true
      });

    if (error) {
      console.error('Error creating standalone chat session:', error);
      return null;
    }

    return sessionId;
  } catch (error) {
    console.error('Exception in createStandaloneRadianceChatSession:', error);
    return null;
  }
}

/**
 * Get the active standalone Ask Radiance AI chat session for a user
 * If no active session exists, create a new one
 * @param userId The user ID
 * @returns The session data
 */
export async function getActiveStandaloneRadianceChatSession(userId: string): Promise<StandaloneRadianceChatSession | null> {
  try {
    if (!userId) {
      console.error('getActiveStandaloneRadianceChatSession: userId is empty');
      return null;
    }

    // Check if tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      return createFallbackSession(userId);
    }

    const supabase = createClient();

    // Try to get an active session
    const { data, error } = await supabase
      .from('standalone_radiance_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting active standalone chat session:', error);
      return createFallbackSession(userId);
    }

    // If an active session exists, return it
    if (data && data.length > 0) {
      return data[0] as StandaloneRadianceChatSession;
    }

    // Otherwise, create a new session
    const sessionId = await createStandaloneRadianceChatSession(userId);
    if (!sessionId) {
      return createFallbackSession(userId);
    }

    // Get the newly created session
    const { data: newSession, error: newSessionError } = await supabase
      .from('standalone_radiance_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (newSessionError) {
      console.error('Error getting new standalone chat session:', newSessionError);
      return createFallbackSession(userId);
    }

    return newSession as StandaloneRadianceChatSession;
  } catch (error) {
    console.error('Exception in getActiveStandaloneRadianceChatSession:', error);
    return createFallbackSession(userId);
  }
}

/**
 * Create a fallback session when database operations fail
 * This allows the component to work even if the database tables don't exist
 * @param userId The user ID
 * @returns A fallback session object
 */
function createFallbackSession(userId: string): StandaloneRadianceChatSession {
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

  return {
    id: sessionId,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: 'Ask Radiance AI Session',
    is_active: true
  };
}

/**
 * Get all messages for a standalone Ask Radiance AI chat session
 * @param sessionId The session ID
 * @param userId The user ID (for security verification)
 * @returns The messages
 */
export async function getStandaloneRadianceChatMessages(
  sessionId: string,
  userId: string
): Promise<StandaloneRadianceChatMessage[]> {
  try {
    if (!sessionId || !userId) {
      return [];
    }

    // Check if tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      return [];
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('standalone_radiance_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting standalone chat messages:', error);
      return [];
    }

    return data as StandaloneRadianceChatMessage[];
  } catch (error) {
    console.error('Exception in getStandaloneRadianceChatMessages:', error);
    return [];
  }
}

/**
 * Add a user message to a standalone Ask Radiance AI chat session
 * @param sessionId The session ID
 * @param userId The user ID
 * @param content The message content
 * @returns The message ID
 */
export async function addStandaloneRadianceUserMessage(
  sessionId: string,
  userId: string,
  content: string
): Promise<string | null> {
  try {
    if (!sessionId || !userId || !content) {
      return null;
    }

    const messageId = uuidv4();

    // Check if tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      return messageId;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('standalone_radiance_chat_messages')
      .insert({
        id: messageId,
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content
      });

    if (error) {
      console.error('Error adding standalone user message:', error);
      return messageId; // Return the ID anyway so the UI can continue
    }

    return messageId;
  } catch (error) {
    console.error('Exception in addStandaloneRadianceUserMessage:', error);
    return uuidv4(); // Return a new ID so the UI can continue
  }
}

/**
 * Process a user message and generate an AI response
 * @param sessionId The session ID
 * @param userId The user ID
 * @param userMessage The user message
 * @returns The AI response
 */
export async function processStandaloneRadianceAIMessage(
  sessionId: string,
  userId: string,
  userMessage: string
): Promise<string | null> {
  try {
    if (!sessionId || !userId || !userMessage) {
      return null;
    }

    // First, add the user message
    const userMessageId = await addStandaloneRadianceUserMessage(sessionId, userId, userMessage);
    if (!userMessageId) {
      return null;
    }

    // Process the message with Radiance AI
    const aiResponse = await processRadianceAI(userMessage, userId);
    if (!aiResponse) {
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    }

    // Check if tables exist
    const tablesExist = await checkTablesExist();

    // Only try to save to the database if the tables exist
    if (tablesExist) {
      const supabase = createClient();
      // Add the AI response to the database
      const messageId = uuidv4();

      const { error } = await supabase
        .from('standalone_radiance_chat_messages')
        .insert({
          id: messageId,
          session_id: sessionId,
          user_id: userId,
          role: 'assistant',
          content: aiResponse.content,
          raw_api_response: aiResponse.raw_response
        });

      if (error) {
        console.error('Error adding standalone AI message:', error);
        // Continue anyway to return the response to the user
      }
    }

    return aiResponse.content;
  } catch (error) {
    console.error('Exception in processStandaloneRadianceAIMessage:', error);
    return "I'm sorry, I encountered an error processing your request. Please try again.";
  }
}

/**
 * Clear all messages for a standalone Ask Radiance AI chat session
 * @param sessionId The session ID
 * @param userId The user ID (for security verification)
 * @returns Whether the operation was successful
 */
export async function clearStandaloneRadianceChatMessages(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    if (!sessionId || !userId) {
      return false;
    }

    // Check if tables exist
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      return true;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('standalone_radiance_chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing standalone chat messages:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in clearStandaloneRadianceChatMessages:', error);
    return false;
  }
}
