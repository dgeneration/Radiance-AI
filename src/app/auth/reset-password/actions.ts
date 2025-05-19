'use server'

import { createClient } from '@/utils/supabase/server'

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const redirectUrl = (formData.get('redirectUrl') as string) || '/dashboard'

  if (!email) {
    return {
      error: 'Email is required',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password?redirectUrl=${encodeURIComponent(redirectUrl)}`,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    return {
      success: 'Check your email for a password reset link',
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
