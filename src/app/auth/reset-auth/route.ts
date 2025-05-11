import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Clear all cookies related to authentication
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    // Create a response that will redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    
    // Clear all cookies that might be related to Supabase auth
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || 
          cookie.name.includes('auth') || 
          cookie.name.includes('sb-') ||
          cookie.name.includes('access_token') ||
          cookie.name.includes('refresh_token')) {
        response.cookies.delete(cookie.name)
      }
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
