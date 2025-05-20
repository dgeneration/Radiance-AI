'use server'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const country = formData.get('country') as string
  const state = formData.get('state') as string
  const city = formData.get('city') as string
  const zipCode = formData.get('zipCode') as string
  const gender = formData.get('gender') as string
  const birthYear = formData.get('birthYear') as string
  const height = formData.get('height') as string
  const weight = formData.get('weight') as string
  const dietaryPreference = formData.get('dietaryPreference') as string
  const captchaToken = formData.get('captchaToken') as string

  if (!email || !password) {
    return {
      error: 'Email and password are required',
    }
  }

  if (!firstName || !lastName) {
    return {
      error: 'First name and last name are required',
    }
  }

  if (!country || !city || !zipCode) {
    return {
      error: 'Location details are required',
    }
  }

  // For countries without states, state can be "N/A"
  if (!state && state !== "N/A") {
    return {
      error: 'State/Province is required',
    }
  }

  if (!gender || !birthYear) {
    return {
      error: 'Gender and birth year are required',
    }
  }

  if (!captchaToken) {
    return {
      error: 'CAPTCHA verification is required',
    }
  }

  try {
    const supabase = await createClient()

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        captchaToken,
      },
    })

    if (authError) {
      return {
        error: authError.message,
      }
    }

    // If signup was successful, create a profile for the user
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          country,
          state,
          city,
          zip_code: zipCode,
          gender,
          birth_year: parseInt(birthYear),
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          dietary_preference: dietaryPreference || null,
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // We don't return this error to the user as the auth part was successful
        // The profile can be completed later
      }
    }

    return {
      success: 'Check your email for a confirmation link',
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
