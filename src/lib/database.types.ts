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
      radiance_chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          created_at: string
          role: string
          content: string
          raw_api_response: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          created_at?: string
          role: string
          content: string
          raw_api_response?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          created_at?: string
          role?: string
          content?: string
          raw_api_response?: Json | null
        }
      },
      standalone_radiance_chat_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          title: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          title?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          title?: string
          is_active?: boolean
        }
      },
      standalone_radiance_chat_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          created_at: string
          role: string
          content: string
          raw_api_response: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          created_at?: string
          role: string
          content: string
          raw_api_response?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          created_at?: string
          role?: string
          content?: string
          raw_api_response?: Json | null
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
          height: number | null
          weight: number | null
          dietary_preference: string | null
          height_edit_count: number | null
          weight_edit_count: number | null
          dietary_preference_edit_count: number | null
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
          height?: number | null
          weight?: number | null
          dietary_preference?: string | null
          height_edit_count?: number | null
          weight_edit_count?: number | null
          dietary_preference_edit_count?: number | null
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
          height?: number | null
          weight?: number | null
          dietary_preference?: string | null
          height_edit_count?: number | null
          weight_edit_count?: number | null
          dietary_preference_edit_count?: number | null
        }
      },
      chain_diagnosis_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          user_input: Json
          medical_analyst_response: Json | null
          general_physician_response: Json | null
          specialist_doctor_response: Json | null
          pathologist_response: Json | null
          nutritionist_response: Json | null
          pharmacist_response: Json | null
          follow_up_specialist_response: Json | null
          summarizer_response: Json | null
          status: string
          current_step: number
          error_message: string | null
          raw_medical_analyst_response: string | null
          raw_general_physician_response: string | null
          raw_specialist_doctor_response: string | null
          raw_pathologist_response: string | null
          raw_nutritionist_response: string | null
          raw_pharmacist_response: string | null
          raw_follow_up_specialist_response: string | null
          raw_summarizer_response: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          user_input: Json
          medical_analyst_response?: Json | null
          general_physician_response?: Json | null
          specialist_doctor_response?: Json | null
          pathologist_response?: Json | null
          nutritionist_response?: Json | null
          pharmacist_response?: Json | null
          follow_up_specialist_response?: Json | null
          summarizer_response?: Json | null
          status?: string
          current_step?: number
          error_message?: string | null
          raw_medical_analyst_response?: string | null
          raw_general_physician_response?: string | null
          raw_specialist_doctor_response?: string | null
          raw_pathologist_response?: string | null
          raw_nutritionist_response?: string | null
          raw_pharmacist_response?: string | null
          raw_follow_up_specialist_response?: string | null
          raw_summarizer_response?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          user_input?: Json
          medical_analyst_response?: Json | null
          general_physician_response?: Json | null
          specialist_doctor_response?: Json | null
          pathologist_response?: Json | null
          nutritionist_response?: Json | null
          pharmacist_response?: Json | null
          follow_up_specialist_response?: Json | null
          summarizer_response?: Json | null
          status?: string
          current_step?: number
          error_message?: string | null
          raw_medical_analyst_response?: string | null
          raw_general_physician_response?: string | null
          raw_specialist_doctor_response?: string | null
          raw_pathologist_response?: string | null
          raw_nutritionist_response?: string | null
          raw_pharmacist_response?: string | null
          raw_follow_up_specialist_response?: string | null
          raw_summarizer_response?: string | null
        }
      },
      tts_audio_cache: {
        Row: {
          id: string
          text_hash: string
          original_text: string
          audio_chunks: string[]
          text_chunks: string[]
          word_counts: number[]
          voice: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          text_hash: string
          original_text: string
          audio_chunks: string[]
          text_chunks: string[]
          word_counts: number[]
          voice?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          text_hash?: string
          original_text?: string
          audio_chunks?: string[]
          text_chunks?: string[]
          word_counts?: number[]
          voice?: string
          created_at?: string
          updated_at?: string
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
