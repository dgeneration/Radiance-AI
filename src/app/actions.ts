'use server';

import { getDiagnosis } from "@/lib/api";
import { SymptomFormData } from "@/types/diagnosis";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Server action to process the symptom form and get a diagnosis
 */
export async function processDiagnosisForm(formData: SymptomFormData) {
  try {
    console.log("Processing diagnosis form with data:", JSON.stringify(formData));

    // Call the API to get a diagnosis
    const { diagnosis, apiResponse } = await getDiagnosis(formData);

    console.log("Diagnosis received successfully");

    // Store the diagnosis in a cookie for the results page
    const diagnosisString = JSON.stringify(diagnosis);
    const cookieStore = await cookies();
    cookieStore.set('diagnosis_result', diagnosisString, {
      maxAge: 3600, // 1 hour
      path: '/',
    });

    // If the user is logged in, try to save the diagnosis to the database
    try {
      const supabase = await createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (userData?.user) {
        // Save the diagnosis to Supabase
        const { error: insertError } = await supabase
          .from('diagnoses')
          .insert({
            user_id: userData.user.id,
            symptoms: formData.symptoms,
            age: formData.age,
            gender: formData.gender,
            duration: formData.duration,
            medical_history: formData.medicalHistory || null,
            diagnosis: diagnosis.primaryDiagnosis.name,
            reasoning: diagnosis.reasoning,
            icd_code: diagnosis.primaryDiagnosis.icdCode,
            citations: diagnosis.citations,
            api_response: apiResponse
          });

        if (insertError) {
          console.error("Error saving diagnosis to database:", insertError);
          // Continue even if there's an error saving to the database
        }
      }
    } catch (dbError) {
      console.error("Error with database operation:", dbError);
      // Continue even if there's an error with the database
    }

    // Return success
    return { success: true };
  } catch (error) {
    console.error("Error processing diagnosis form:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
