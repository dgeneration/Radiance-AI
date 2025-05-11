export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      diagnoses: {
        Row: {
          id: string
          created_at: string
          user_id: string
          symptoms: string
          age: string
          gender: string
          duration: string
          medical_history: string | null
          diagnosis: string
          reasoning: string
          icd_code: string
          citations: Json
          api_response: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          symptoms: string
          age: string
          gender: string
          duration: string
          medical_history?: string | null
          diagnosis: string
          reasoning: string
          icd_code: string
          citations: Json
          api_response?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          symptoms?: string
          age?: string
          gender?: string
          duration?: string
          medical_history?: string | null
          diagnosis?: string
          reasoning?: string
          icd_code?: string
          citations?: Json
          api_response?: Json | null
        }
      },
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          country: string
          state: string
          city: string
          zip_code: string
          gender: string
          birth_year: number
          health_history: string | null
          medical_conditions: string | null
          allergies: string | null
          medications: string | null
          has_edited_health_info: boolean | null
          first_name_edit_count: number | null
          last_name_edit_count: number | null
          country_edit_count: number | null
          state_edit_count: number | null
          city_edit_count: number | null
          zip_code_edit_count: number | null
          gender_edit_count: number | null
          birth_year_edit_count: number | null
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          country: string
          state: string
          city: string
          zip_code: string
          gender: string
          birth_year: number
          health_history?: string | null
          medical_conditions?: string | null
          allergies?: string | null
          medications?: string | null
          has_edited_health_info?: boolean | null
          first_name_edit_count?: number | null
          last_name_edit_count?: number | null
          country_edit_count?: number | null
          state_edit_count?: number | null
          city_edit_count?: number | null
          zip_code_edit_count?: number | null
          gender_edit_count?: number | null
          birth_year_edit_count?: number | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          country?: string
          state?: string
          city?: string
          zip_code?: string
          gender?: string
          birth_year?: number
          health_history?: string | null
          medical_conditions?: string | null
          allergies?: string | null
          medications?: string | null
          has_edited_health_info?: boolean | null
          first_name_edit_count?: number | null
          last_name_edit_count?: number | null
          country_edit_count?: number | null
          state_edit_count?: number | null
          city_edit_count?: number | null
          zip_code_edit_count?: number | null
          gender_edit_count?: number | null
          birth_year_edit_count?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
