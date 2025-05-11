-- Add api_response column to diagnoses table
ALTER TABLE public.diagnoses
ADD COLUMN api_response JSONB;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN public.diagnoses.api_response IS 'Stores the full API response from Perplexity for debugging and enhanced display';