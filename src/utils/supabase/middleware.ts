import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Skip auth check for certain paths
  const url = new URL(request.url)
  const isAuthPath = url.pathname.startsWith('/auth')
  const isLegalPath = url.pathname === '/privacy' ||
                      url.pathname === '/terms' ||
                      url.pathname === '/disclaimer'
  const isPublicPath = url.pathname === '/' ||
                       url.pathname.startsWith('/_next') ||
                       url.pathname.startsWith('/api') ||
                       url.pathname.includes('favicon') ||
                       url.pathname.includes('.svg') ||
                       url.pathname.includes('.png') ||
                       url.pathname.includes('.json') ||
                       url.pathname.includes('.js') ||
                       url.pathname.includes('.css') ||
                       url.pathname.startsWith('/icons') ||
                       url.pathname === '/forbidden' ||
                       url.pathname === '/offline' ||
                       url.pathname === '/manifest.json' ||
                       url.pathname === '/sw.js' ||
                       url.pathname.startsWith('/worker-') ||
                       isLegalPath

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Only check auth for protected routes
    if (!isAuthPath && !isPublicPath) {
      const { data: { user }, error } = await supabase.auth.getUser()

      // If there's an auth error and we're not already on an auth page, redirect to error page
      if (error && error.message.includes('JWT')) {
        const errorUrl = new URL('/auth/error', request.url)
        errorUrl.searchParams.set('message', 'Authentication token is invalid or expired. Please log in again.')
        return NextResponse.redirect(errorUrl)
      }

      // If no user and we're not on an auth page, redirect to login
      if (!user && !isAuthPath && !isPublicPath) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirectUrl', url.pathname)
        return NextResponse.redirect(loginUrl)
      }
    } else {
      // For auth pages, just update the session
      await supabase.auth.getUser()
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    // If there's an error, continue with the request
  }

  return response
}
