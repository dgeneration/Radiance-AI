'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Delete a user account from Supabase authentication
 * This must be done server-side with admin privileges
 */
export async function deleteUserAccount(formData: FormData) {
  try {
    const userId = formData.get('userId') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!userId || !email || !password) {
      return {
        success: false,
        error: 'User ID, email, and password are required'
      }
    }

    // Create regular client for password verification
    const supabase = await createClient()

    // First verify the user's password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return {
        success: false,
        error: 'Incorrect password. Please try again.'
      }
    }

    // Create admin client for operations requiring elevated permissions
    const adminClient = await createAdminClient()

    // Delete user profile data
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return {
        success: false,
        error: `Failed to delete profile data: ${profileError.message}`
      }
    }

    // Delete user from Supabase auth using admin client
    // This requires service_role privileges
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting user auth:', authError)
      return {
        success: false,
        error: `Failed to delete user authentication: ${authError.message}`,
        partialSuccess: true // Profile was deleted but auth wasn't
      }
    }

    // Sign out the user using the regular client
    await supabase.auth.signOut()

    // Redirect to home page
    redirect('/')
  } catch (error) {
    console.error('Error in deleteUserAccount:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the account'
    }
  }
}
