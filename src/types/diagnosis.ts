// Form data for symptom input
export interface SymptomFormData {
  symptoms: string;
  age: string;
  gender: string;
  duration: string;
  medicalHistory?: string;
}

// Diagnosis result from the API
export interface Diagnosis {
  primaryDiagnosis: {
    name: string;
    description: string;
    icdCode: string;
    severity?: string;
    commonSymptoms?: string[];
  };
  differentialDiagnoses?: {
    name: string;
    icdCode: string;
    likelihood: string;
  }[];
  reasoning: string;
  medicationPlan?: {
    name: string;
    purpose: string;
    dosage: string;
    timing: string;
    duration: string;
    notes: string;
  }[];
  testRecommendations?: {
    testName: string;
    reason: string;
  }[];
  lifestyleAdvice?: string[];
  followUp?: string;
  citations: {
    title: string;
    url: string;
  }[];
}
