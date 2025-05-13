import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Update the session and handle auth redirects
  return await updateSession(request);
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
