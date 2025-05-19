import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client with the anon key for regular user operations
 * This client has the same permissions as the logged-in user
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          // Some Next.js versions treat cookieStore as readonly, so use ts-expect-error
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options?: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with the service role key for admin operations
 * This client has admin privileges and should only be used for operations
 * that require elevated permissions, such as deleting users
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options?: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
