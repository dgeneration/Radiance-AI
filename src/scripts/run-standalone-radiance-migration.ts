import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function runMigration() {
  try {
    // Create a Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or service role key not found in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Running migration for standalone Radiance AI chat tables...');

    // Execute the migration SQL
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        -- Create standalone_radiance_chat_sessions table for storing standalone chat sessions
        CREATE TABLE IF NOT EXISTS standalone_radiance_chat_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          title TEXT DEFAULT 'Standalone Chat Session',
          is_active BOOLEAN DEFAULT TRUE
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS standalone_radiance_chat_sessions_user_id_idx ON standalone_radiance_chat_sessions(user_id);
        CREATE INDEX IF NOT EXISTS standalone_radiance_chat_sessions_created_at_idx ON standalone_radiance_chat_sessions(created_at);
        CREATE INDEX IF NOT EXISTS standalone_radiance_chat_sessions_is_active_idx ON standalone_radiance_chat_sessions(is_active);

        -- Set up Row Level Security (RLS)
        ALTER TABLE standalone_radiance_chat_sessions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        -- Users can only view their own standalone chat sessions
        CREATE POLICY "Users can view their own standalone chat sessions"
        ON standalone_radiance_chat_sessions
        FOR SELECT
        USING (auth.uid() = user_id);

        -- Users can only insert their own standalone chat sessions
        CREATE POLICY "Users can insert their own standalone chat sessions"
        ON standalone_radiance_chat_sessions
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        -- Users can only update their own standalone chat sessions
        CREATE POLICY "Users can update their own standalone chat sessions"
        ON standalone_radiance_chat_sessions
        FOR UPDATE
        USING (auth.uid() = user_id);

        -- Users can only delete their own standalone chat sessions
        CREATE POLICY "Users can delete their own standalone chat sessions"
        ON standalone_radiance_chat_sessions
        FOR DELETE
        USING (auth.uid() = user_id);

        -- Create standalone_radiance_chat_messages table for storing standalone chat messages
        CREATE TABLE IF NOT EXISTS standalone_radiance_chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL REFERENCES standalone_radiance_chat_sessions(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          raw_api_response JSONB
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS standalone_radiance_chat_messages_session_id_idx ON standalone_radiance_chat_messages(session_id);
        CREATE INDEX IF NOT EXISTS standalone_radiance_chat_messages_user_id_idx ON standalone_radiance_chat_messages(user_id);
        CREATE INDEX IF NOT EXISTS standalone_radiance_chat_messages_created_at_idx ON standalone_radiance_chat_messages(created_at);

        -- Set up Row Level Security (RLS)
        ALTER TABLE standalone_radiance_chat_messages ENABLE ROW LEVEL SECURITY;

        -- Create policies
        -- Users can only view their own standalone chat messages
        CREATE POLICY "Users can view their own standalone chat messages"
        ON standalone_radiance_chat_messages
        FOR SELECT
        USING (auth.uid() = user_id);

        -- Users can only insert their own standalone chat messages
        CREATE POLICY "Users can insert their own standalone chat messages"
        ON standalone_radiance_chat_messages
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        -- Users can only update their own standalone chat messages
        CREATE POLICY "Users can update their own standalone chat messages"
        ON standalone_radiance_chat_messages
        FOR UPDATE
        USING (auth.uid() = user_id);

        -- Users can only delete their own standalone chat messages
        CREATE POLICY "Users can delete their own standalone chat messages"
        ON standalone_radiance_chat_messages
        FOR DELETE
        USING (auth.uid() = user_id);

        -- Create a function to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_standalone_chat_session_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create a trigger to update the updated_at timestamp
        CREATE TRIGGER update_standalone_chat_session_timestamp
        BEFORE UPDATE ON standalone_radiance_chat_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_standalone_chat_session_timestamp();

        -- Create a function to update the session's updated_at timestamp when a message is added
        CREATE OR REPLACE FUNCTION update_standalone_chat_session_on_message()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE standalone_radiance_chat_sessions
          SET updated_at = NOW()
          WHERE id = NEW.session_id;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create a trigger to update the session's updated_at timestamp when a message is added
        CREATE TRIGGER update_standalone_chat_session_on_message
        AFTER INSERT ON standalone_radiance_chat_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_standalone_chat_session_on_message();
      `
    });

    if (error) {
      throw new Error(`Error executing migration: ${error.message}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
