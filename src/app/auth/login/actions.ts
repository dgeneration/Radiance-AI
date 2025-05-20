'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const captchaToken = formData.get('captchaToken') as string
  const redirectUrl = (formData.get('redirectUrl') as string) || '/dashboard'

  if (!email || !password) {
    return {
      error: 'Email and password are required',
    }
  }

  if (!captchaToken) {
    return {
      error: 'CAPTCHA verification is required',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken
      }
    })

    if (error) {
      // Special handling for JWT errors
      if (error.message.includes('JWT') || error.message.includes('token') || error.message.includes('User from sub claim')) {
        return {
          error: 'Authentication token is invalid or expired. Please try resetting your authentication state.',
        }
      }
      return {
        error: error.message,
      }
    }

    // If login is successful, redirect to the dashboard
    redirect(redirectUrl)
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error // Let Next.js handle redirect
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error)
    }

    console.error('Login error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const captchaToken = formData.get('captchaToken') as string
  const redirectUrl = (formData.get('redirectUrl') as string) || '/dashboard'

  if (!email || !password) {
    return {
      error: 'Email and password are required',
    }
  }

  if (!captchaToken) {
    return {
      error: 'CAPTCHA verification is required',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      captchaToken
    },
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  return {
    success: 'Check your email for a confirmation link',
    redirect: redirectUrl,
  }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
