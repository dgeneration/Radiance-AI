import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Create a response that will redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url))

    // Clear all cookies that might be related to Supabase auth
    const cookieNames = [
      'supabase-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-refresh-token',
      'access_token',
      'refresh_token'
    ]

    // Delete each cookie from the response
    for (const name of cookieNames) {
      response.cookies.delete(name)
    }

    // Try to sign out using Supabase client
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out with Supabase:', error)
      // Continue with the response even if this fails
    }

    return response
  } catch (error) {
    console.error('Error in reset-auth route:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}
