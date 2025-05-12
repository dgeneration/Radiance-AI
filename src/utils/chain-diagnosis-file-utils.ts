import { createClient } from '@/utils/supabase/client';
import { FileMetadata } from '@/utils/supabase/file-storage';
import { ChainDiagnosisUserInput } from '@/types/chain-diagnosis';

/**
 * Extract text content from a PDF file
 * @param fileUrl The URL of the PDF file
 * @returns The extracted text content
 */
export async function extractTextFromPdf(fileUrl: string): Promise<string> {
  try {
    // In a real implementation, you would use a PDF parsing library
    // For now, we'll just make a request to get the file and return a placeholder
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // This is a placeholder - in a real implementation, you would parse the PDF
    return "This is extracted text from the PDF file. In a real implementation, you would use a PDF parsing library like pdf.js or a server-side solution.";
  } catch (error) {
    return '';
  }
}

/**
 * Extract text content from an image using OCR
 * @param fileUrl The URL of the image file
 * @returns The extracted text content
 */
export async function extractTextFromImage(fileUrl: string): Promise<string> {
  try {
    // In a real implementation, you would use an OCR service
    // For now, we'll just make a request to get the file and return a placeholder
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // This is a placeholder - in a real implementation, you would use OCR
    return "This is extracted text from the image file. In a real implementation, you would use an OCR service like Tesseract.js or a cloud OCR API.";
  } catch (error) {
    return '';
  }
}

/**
 * Process a medical report file and extract its text content
 * @param file The file metadata
 * @returns The extracted text content
 */
export async function processMedicalReportFile(file: FileMetadata): Promise<string> {
  try {
    // Get a signed URL for the file
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('medical-reports')
      .createSignedUrl(file.path, 60);

    if (error || !data?.signedUrl) {
      return '';
    }

    const fileUrl = data.signedUrl;
    const fileType = file.type.toLowerCase();

    // Extract text based on file type
    if (fileType.includes('pdf')) {
      return await extractTextFromPdf(fileUrl);
    } else if (fileType.includes('image')) {
      return await extractTextFromImage(fileUrl);
    } else if (fileType.includes('text')) {
      // For text files, just fetch the content
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch text file: ${response.statusText}`);
      }
      return await response.text();
    } else {
      return `Unsupported file type: ${fileType}`;
    }
  } catch (error) {
    return '';
  }
}

/**
 * Prepare medical report data for the Chain Diagnosis System
 * @param files The selected files
 * @returns The medical report data
 */
export async function prepareMedicalReportData(files: FileMetadata[]): Promise<ChainDiagnosisUserInput['medical_report']> {
  try {
    if (!files || files.length === 0) {
      return undefined;
    }

    // For simplicity, we'll just use the first file
    const file = files[0];

    // Process the file to extract text
    const extractedText = await processMedicalReportFile(file);

    // Check if the file is an image
    const isImage = file.type.toLowerCase().includes('image');
    const publicUrl = file.public_url || '';

    // Prepare file metadata for the Chain Diagnosis System

    // For image files, only include the image_url field to avoid confusion
    // This ensures the AI focuses on analyzing the image directly
    const result = isImage ? {
      image_url: publicUrl
    } : {
      url: publicUrl,
      name: file.name,
      type: file.type,
      text: extractedText
    };

    return result;
  } catch (error) {
    return undefined;
  }
}

/**
 * Convert user profile and symptom data to Chain Diagnosis user input format
 * @param userId The user ID
 * @param userProfile The user profile data
 * @param symptomData The symptom form data
 * @param selectedFiles Optional selected medical report files
 * @returns The Chain Diagnosis user input
 */
export async function convertToChainDiagnosisInput(
  userId: string,
  userProfile: any,
  symptomData: any,
  selectedFiles?: FileMetadata[]
): Promise<ChainDiagnosisUserInput> {
  // Get the authenticated user ID to ensure it matches
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Use the authenticated user ID if available, otherwise use the provided userId
  const authenticatedUserId = user?.id || userId;

  // Process medical report files if provided
  const medicalReport = selectedFiles && selectedFiles.length > 0
    ? await prepareMedicalReportData(selectedFiles)
    : undefined;

  // Parse symptoms into an array
  const symptomsList = symptomData.symptoms
    .split(',')
    .map((symptom: string) => symptom.trim())
    .filter((symptom: string) => symptom.length > 0);

  // Calculate BMI if height and weight are available
  let bmi: number | undefined = undefined;
  if (userProfile.height && userProfile.weight) {
    // BMI = weight(kg) / (height(m))²
    const heightInMeters = userProfile.height / 100;
    bmi = userProfile.weight / (heightInMeters * heightInMeters);
    bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal place
  }

  // Calculate age from birth year
  const currentYear = new Date().getFullYear();
  const age = userProfile.birth_year ? currentYear - userProfile.birth_year : 0;

  // Construct the Chain Diagnosis user input
  return {
    user_details: {
      id: authenticatedUserId, // Use the authenticated user ID
      first_name: userProfile.first_name || '',
      last_name: userProfile.last_name || '',
      country: userProfile.country || '',
      state: userProfile.state || '',
      city: userProfile.city || '',
      zip_code: userProfile.zip_code || '',
      gender: userProfile.gender || symptomData.gender || '',
      birth_year: userProfile.birth_year || currentYear - parseInt(symptomData.age),
      age: age || parseInt(symptomData.age)
    },
    health_metrics: {
      height: userProfile.height,
      weight: userProfile.weight,
      bmi,
      dietary_preference: userProfile.dietary_preference || 'Not specified'
    },
    symptoms_info: {
      symptoms_list: symptomsList,
      duration: symptomData.duration
    },
    medical_info: {
      allergies: userProfile.allergies || '',
      medications: userProfile.medications || '',
      medical_conditions: userProfile.medical_conditions || '',
      health_history: userProfile.health_history || symptomData.medicalHistory || ''
    },
    medical_report: medicalReport
  };
}
