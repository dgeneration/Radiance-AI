import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function initChainDiagnosisDb() {
  try {
    console.log('Initializing Chain Diagnosis database...');

    // Create the chain_diagnosis_sessions table
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
      return;
    }

    console.log('Table created successfully');

    // Create indexes
    const { error: createIndexesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_user_id_idx ON chain_diagnosis_sessions(user_id);
        CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_created_at_idx ON chain_diagnosis_sessions(created_at);
        CREATE INDEX IF NOT EXISTS chain_diagnosis_sessions_status_idx ON chain_diagnosis_sessions(status);
      `
    });

    if (createIndexesError) {
      console.error('Error creating indexes:', createIndexesError);
      return;
    }

    console.log('Indexes created successfully');

    // Enable RLS
    const { error: enableRlsError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE chain_diagnosis_sessions ENABLE ROW LEVEL SECURITY;
      `
    });

    if (enableRlsError) {
      console.error('Error enabling RLS:', enableRlsError);
      return;
    }

    console.log('RLS enabled successfully');

    // Create RLS policies
    const { error: createPoliciesError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Users can only view their own sessions
        CREATE POLICY "Users can view their own chain diagnosis sessions"
        ON chain_diagnosis_sessions
        FOR SELECT
        USING (auth.uid() = user_id);

        -- Users can only insert their own sessions
        CREATE POLICY "Users can insert their own chain diagnosis sessions"
        ON chain_diagnosis_sessions
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

        -- Users can only update their own sessions
        CREATE POLICY "Users can update their own chain diagnosis sessions"
        ON chain_diagnosis_sessions
        FOR UPDATE
        USING (auth.uid() = user_id);

        -- Users can only delete their own sessions
        CREATE POLICY "Users can delete their own chain diagnosis sessions"
        ON chain_diagnosis_sessions
        FOR DELETE
        USING (auth.uid() = user_id);
      `
    });

    if (createPoliciesError) {
      console.error('Error creating policies:', createPoliciesError);
      return;
    }

    console.log('Policies created successfully');

    // Create storage bucket for medical reports
    const { error: createBucketError } = await supabase.storage.createBucket('medical-reports', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
    });

    if (createBucketError) {
      console.error('Error creating storage bucket:', createBucketError);
      return;
    }

    console.log('Storage bucket created successfully');

    console.log('Chain Diagnosis database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing Chain Diagnosis database:', error);
  }
}

// Run the initialization
initChainDiagnosisDb();
