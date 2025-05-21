// Chain Diagnosis System Types
// These types define the structure of the data used in the multi-agent chain diagnosis system

// Base user input structure that will be passed to all AI roles
export interface ChainDiagnosisUserInput {
  user_details: {
    id: string;
    first_name: string;
    last_name: string;
    country?: string;
    state?: string;
    city?: string;
    zip_code?: string;
    gender: string;
    birth_year: number;
    age: number;
  };
  health_metrics?: {
    height?: number; // in cm
    weight?: number; // in kg
    bmi?: number;
    dietary_preference?: string;
  };
  symptoms_info: {
    symptoms_list: string[];
    duration: string;
  };
  medical_info?: {
    allergies?: string;
    medications?: string;
    medical_conditions?: string;
    health_history?: string;
  };
  medical_report?: {
    url?: string;
    name?: string;
    type?: string;
    text?: string;
    image_url?: string; // URL for medical images to be analyzed
  };
}

// Base response interface that all AI role responses will extend
export interface BaseAIResponse {
  role_name: string;
  disclaimer: string;
  reference_data_for_next_role: Record<string, unknown>;
}

// 1. Medical Analyst AI Response
export interface MedicalAnalystResponse extends BaseAIResponse {
  report_type_analyzed: string;
  // Optional image analysis field for when an image URL is provided
  image_analysis?: {
    image_description: string;
    visible_findings: string[];
    possible_abnormalities: string[];
  };
  key_findings_from_report: string[];
  abnormalities_highlighted: string[];
  clinical_correlation_points_for_gp: string[];
  reference_data_for_next_role: {
    analyst_summary: string;
    raw_findings_ref: string;
  };
}

// 2. General Physician AI Response
export interface GeneralPhysicianResponse extends BaseAIResponse {
  patient_summary_review: {
    name: string;
    age: number;
    key_symptoms: string[];
    relevant_history: string[];
  };
  medical_analyst_findings_summary: string;
  preliminary_symptom_analysis: string[];
  potential_areas_of_concern: string[];
  recommended_specialist_type: string;
  general_initial_advice: string[];
  questions_for_specialist_consultation: string[];
  reference_data_for_next_role: {
    gp_summary_of_case: string;
    gp_reason_for_specialist_referral: string;
    analyst_ref_if_any: string;
  };
}

// 3. Specialist Doctor AI Response
export interface SpecialistDoctorResponse extends BaseAIResponse {
  role_name: string; // This will include the specialist type, e.g., "Pulmonologist AI (Radiance AI)"
  patient_case_review_from_specialist_viewpoint: {
    key_information_from_gp_referral: string;
    medical_analyst_data_consideration: string;
    specialist_focus_points: string[];
  };
  specialized_assessment_and_potential_conditions: {
    condition_hypothesis: string;
    reasoning: string;
    symptoms_match: string[];
  }[];
  recommended_diagnostic_and_management_approach: {
    further_investigations_suggested: string[];
    general_management_principles: string[];
    lifestyle_and_supportive_care_notes: string[];
  };
  key_takeaways_for_patient: string[];
  reference_data_for_next_role: {
    specialist_assessment_summary: string;
    potential_conditions_considered: string[];
    management_direction: string;
  };
}

// 4. Pathologist AI Response
export interface PathologistResponse extends BaseAIResponse {
  context_from_specialist: {
    specialist_type_consulted: string;
    potential_conditions_under_review: string[];
    suggested_investigations_by_specialist: string[];
  };
  pathological_insights_for_potential_conditions: {
    condition_hypothesis: string;
    relevant_lab_tests_and_expected_findings: {
      test_name: string;
      potential_findings_explained: string;
    }[];
  }[];
  notes_on_test_interpretation: string[];
  reference_data_for_next_role: {
    pathology_summary: string;
    critical_markers_highlighted: string[];
  };
}

// 5. Nutritionist AI Response
export interface NutritionistResponse extends BaseAIResponse {
  nutritional_assessment_overview: {
    bmi_status: string;
    dietary_preference: string;
    key_considerations_from_medical_context: string[];
  };
  general_dietary_goals: string[];
  dietary_recommendations: {
    foods_to_emphasize: {
      category: string;
      examples: string[];
    }[];
    foods_to_consider_limiting_during_illness: string[];
    meal_frequency_and_timing_tips: string[];
  };
  addressing_weight_concerns: string[];
  reference_data_for_next_role: {
    nutrition_summary: string;
    weight_concern_highlight: string;
  };
}

// 6. Pharmacist AI Response
export interface PharmacistResponse extends BaseAIResponse {
  patient_medication_profile_review: {
    allergies: string;
    current_medications: string;
    current_conditions_relevant_to_meds: string;
  };
  medication_classes_potentially_relevant: {
    medication_class: string;
    context: string;
    alternative_examples_due_to_allergy?: string[];
    general_administration_notes: string;
    common_class_side_effects: string[];
    types?: {
      name: string;
      notes: string;
    }[];
  }[];
  key_pharmacological_considerations: string[];
  reference_data_for_next_role: {
    pharmacist_summary: string;
    allergy_alert: string;
  };
}

// 7. Follow-up Specialist AI Response
export interface FollowUpSpecialistResponse extends BaseAIResponse {
  synthesis_of_case_progression: {
    initial_concern: string;
    key_insights_from_ais: string[];
  };
  symptom_monitoring_guidelines: {
    symptoms_to_track_closely: string[];
    improvement_indicators: string[];
  };
  recommended_follow_up_guidance: {
    initial_consultation: string;
    post_treatment_follow_up: string;
    routine_follow_up: string;
  };
  when_to_seek_urgent_medical_care_RED_FLAGS: string[];
  reinforcement_of_key_advice: string[];
  reference_data_for_next_role: {
    follow_up_summary: string;
    critical_takeaways_for_patient_journey: string;
  };
}

// 8. Radiance AI Summarizer Response
export interface RadianceAISummarizerResponse {
  report_title: string;
  report_generated_for: string;
  report_date: string;
  introduction: string;
  patient_information_summary: {
    name: string;
    age: number | string;
    gender: string;
    location: string;
    key_symptoms_reported: string[];
    symptom_duration: string;
    relevant_medical_history: string[];
    bmi_status: string;
  };
  potential_diagnoses?: {
    name: string;
    description: string;
    confidence_level: string;
    symptoms_matched: string[];
  }[];
  recommended_tests?: string[];
  medication_guidance?: {
    current_medications: string[];
    medications_to_avoid: string[];
    potential_medications: string[];
  };
  dietary_lifestyle_recommendations?: {
    dietary_recommendations: string[];
    lifestyle_recommendations: string[];
  };
  radiance_ai_team_journey_overview: {
    role: string;
    summary_of_findings?: string;
    summary_of_assessment?: string;
    summary_of_insights?: string;
    summary_of_recommendations?: string;
    summary_of_guidance?: string;
    summary_of_advice?: string;
  }[];
  key_takeaways_and_recommendations_for_patient: string[];
  final_disclaimer_from_radiance_ai: string;
}

// Combined type for any AI response in the chain
export type ChainAIResponse =
  | MedicalAnalystResponse
  | GeneralPhysicianResponse
  | SpecialistDoctorResponse
  | PathologistResponse
  | NutritionistResponse
  | PharmacistResponse
  | FollowUpSpecialistResponse
  | RadianceAISummarizerResponse;

// Chat message types for the Ask Radiance feature
export interface RadianceChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  content: string;
  raw_api_response?: Record<string, unknown>;
}

// Chain Diagnosis Session to store in the database
export interface ChainDiagnosisSession {
  id: string;
  user_id: string;
  created_at: string;
  user_input: ChainDiagnosisUserInput;
  medical_analyst_response?: MedicalAnalystResponse;
  general_physician_response?: GeneralPhysicianResponse;
  specialist_doctor_response?: SpecialistDoctorResponse;
  pathologist_response?: PathologistResponse;
  nutritionist_response?: NutritionistResponse;
  pharmacist_response?: PharmacistResponse;
  follow_up_specialist_response?: FollowUpSpecialistResponse;
  summarizer_response?: RadianceAISummarizerResponse;

  // Raw API responses for debugging and analysis
  raw_medical_analyst_response?: string;
  raw_general_physician_response?: string;
  raw_specialist_doctor_response?: string;
  raw_pathologist_response?: string;
  raw_nutritionist_response?: string;
  raw_pharmacist_response?: string;
  raw_follow_up_specialist_response?: string;
  raw_summarizer_response?: string;

  status: 'in_progress' | 'completed' | 'error';
  current_step: number;
  error_message?: string;
}
