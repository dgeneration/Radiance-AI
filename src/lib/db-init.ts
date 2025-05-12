import { createClient } from '@/utils/supabase/client';

/**
 * Initialize the database tables required for the Chain Diagnosis System
 */
export async function initChainDiagnosisDb() {
  try {
    console.log('Initializing Chain Diagnosis database...');
    const supabase = createClient();

    // Try to create the chain_diagnosis_sessions table using direct SQL
    try {
      const { error: createTableError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS chain_diagnosis_sessions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            user_input JSONB NOT NULL,
            medical_analyst_response JSONB,
            general_physician_response JSONB,
            specialist_doctor_response JSONB,
            pathologist_response JSONB,
            nutritionist_response JSONB,
            pharmacist_response JSONB,
            follow_up_specialist_response JSONB,
            summarizer_response JSONB,
            status TEXT NOT NULL DEFAULT 'in_progress',
            current_step INTEGER NOT NULL DEFAULT 0,
            error_message TEXT
          );
        `
      });

      if (createTableError) {
        console.error('Error creating table:', createTableError);

        // If the RPC method isn't available, try a different approach
        if (createTableError.message.includes('function') && createTableError.message.includes('does not exist')) {
          console.log('RPC method not available, trying alternative approach...');

          // Try to create the table using a direct query
          const { error: directQueryError } = await supabase
            .from('chain_diagnosis_sessions')
            .insert({
              id: '00000000-0000-0000-0000-000000000000',
              user_id: '00000000-0000-0000-0000-000000000000',
              created_at: new Date().toISOString(),
              user_input: {},
              status: 'test',
              current_step: 0
            });

          // If the table doesn't exist, we'll get a specific error
          if (directQueryError && directQueryError.message.includes('does not exist')) {
            console.log('Table does not exist, but we cannot create it directly. Skipping table creation.');
          }
        }
      }
    } catch (error) {
      console.error('Error in table creation attempt:', error);
    }

    // Try to create indexes
    try {
      const { error: createIndexesError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_user_id_idx ON chain_diagnosis_sessions(user_id);
          CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_created_at_idx ON chain_diagnosis_sessions(created_at);
          CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_status_idx ON chain_diagnosis_sessions(status);
        `
      });

      if (createIndexesError) {
        console.error('Error creating indexes:', createIndexesError);
      }
    } catch (error) {
      console.error('Error in index creation attempt:', error);
    }

    // Try to enable RLS
    try {
      const { error: enableRlsError } = await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE chain_diagnosis_sessions ENABLE ROW LEVEL SECURITY;
        `
      });

      if (enableRlsError) {
        console.error('Error enabling RLS:', enableRlsError);
      }
    } catch (error) {
      console.error('Error in RLS enabling attempt:', error);
    }

    // Try to create RLS policies
    try {
      const { error: createPoliciesError } = await supabase.rpc('execute_sql', {
        sql: `
          -- Users can only view their own sessions
          CREATE POLICY IF NOT EXISTS "Users can view their own chain diagnosis sessions"
          ON chain_diagnosis_sessions
          FOR SELECT
          USING (auth.uid() = user_id);

          -- Users can only insert their own sessions
          CREATE POLICY IF NOT EXISTS "Users can insert their own chain diagnosis sessions"
          ON chain_diagnosis_sessions
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);

          -- Users can only update their own sessions
          CREATE POLICY IF NOT EXISTS "Users can update their own chain diagnosis sessions"
          ON chain_diagnosis_sessions
          FOR UPDATE
          USING (auth.uid() = user_id);

          -- Users can only delete their own sessions
          CREATE POLICY IF NOT EXISTS "Users can delete their own chain diagnosis sessions"
          ON chain_diagnosis_sessions
          FOR DELETE
          USING (auth.uid() = user_id);
        `
      });

      if (createPoliciesError) {
        console.error('Error creating policies:', createPoliciesError);
      }
    } catch (error) {
      console.error('Error in policy creation attempt:', error);
    }

    // Create storage bucket for medical reports
    try {
      const { error: createBucketError } = await supabase.storage.createBucket('medical-reports', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
      });

      if (createBucketError && !createBucketError.message.includes('already exists')) {
        console.error('Error creating storage bucket:', createBucketError);
      } else {
        console.log('Storage bucket created or already exists');
      }
    } catch (bucketError) {
      console.error('Error handling storage bucket:', bucketError);
    }

    console.log('Chain Diagnosis database initialization completed');
    return true;
  } catch (error) {
    console.error('Error initializing Chain Diagnosis database:', error);
    return false;
  }
}
