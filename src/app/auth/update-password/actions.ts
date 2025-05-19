'use server'

import { createClient } from '@/utils/supabase/server'
// import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  // const redirectUrl = (formData.get('redirectUrl') as string) || '/dashboard'

  if (!password) {
    return {
      error: 'Password is required',
    }
  }

  if (password.length < 6) {
    return {
      error: 'Password must be at least 6 characters long',
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    return {
      success: 'Your password has been updated successfully. You can now log in with your new password.',
    }
  } catch (error) {
    console.error('Update password error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
