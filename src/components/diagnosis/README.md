# Standalone Ask Radiance AI Component

This component provides a standalone chat interface for interacting with Radiance AI. It allows users to ask health-related questions and receive responses from the AI.

## Features

- Persistent chat sessions
- File uploads for medical reports
- Clear chat history
- Responsive design
- Fallback mode when database tables don't exist

## Database Setup

The component requires two database tables in Supabase:

1. `standalone_radiance_chat_sessions` - Stores chat sessions
2. `standalone_radiance_chat_messages` - Stores chat messages

### Creating the Database Tables

There are three ways to create the required database tables:

#### Option 1: Using the Script

Run the provided script to create the tables:

```bash
node src/scripts/create-standalone-tables.js
```

This script requires the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Option 2: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL from `supabase/migrations/20240530_create_standalone_radiance_chat_tables.sql`
5. Execute the query

#### Option 3: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push
```

This will apply all migrations in the `supabase/migrations` directory.

## Fallback Mode

If the database tables don't exist, the component will operate in fallback mode:

- Chat sessions and messages will be stored in memory only
- Messages will be lost when the page is refreshed
- All functionality will continue to work, but without persistence

## Usage

```tsx
import { StandaloneAskRadiance } from "@/components/diagnosis/standalone-ask-radiance";

export default function AskRadiancePage() {
  return (
    <div>
      <h1>Ask Radiance AI</h1>
      <StandaloneAskRadiance />
    </div>
  );
}
```

## API

The component uses the following API functions:

- `getActiveStandaloneRadianceChatSession` - Gets or creates a chat session
- `getStandaloneRadianceChatMessages` - Gets messages for a session
- `addStandaloneRadianceUserMessage` - Adds a user message
- `processStandaloneRadianceAIMessage` - Processes a message with Radiance AI
- `clearStandaloneRadianceChatMessages` - Clears messages for a session

These functions are defined in `src/lib/standalone-radiance-api.ts`.

## Troubleshooting

If you encounter issues with the database connection:

1. Check that the Supabase URL and API key are correctly set in your environment variables
2. Verify that the database tables exist in your Supabase project
3. Check the browser console for error messages
4. Try running the database creation script again

## License

This component is part of the Radiance AI project and is subject to the same license terms.
