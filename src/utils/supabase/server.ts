import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // ✅ Await this!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = cookieStore.get(name) // No need to await here
          return cookie?.value
        },
        async set(name: string, value: string, options: { expires?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          try {
            await cookieStore.set({ name, value, ...options })
          } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // This error can be safely ignored if in a server component
          }
        },
        async remove(name: string, options: { expires?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: 'strict' | 'lax' | 'none' }) {
          try {
            await cookieStore.set({ name, value: '', ...options })
          } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // This error can be safely ignored if in a server component
          }
        },
      },
    }
  )
}
