import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Diagnosis } from "@/types/diagnosis";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { SubNavbar } from "@/components/sub-navbar";

export const metadata: Metadata = {
  title: "Diagnosis Results | Radiance AI",
  description: "View your AI-powered diagnosis results",
};

export default async function DiagnosisResultsPage() {
  // Check if user is logged in
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Redirect non-logged in users to the login page
  if (!data.user) {
    redirect("/auth/login?redirectUrl=/diagnosis/results");
  }

  // Get the diagnosis from cookies
  const cookieStore = await cookies();
  const diagnosisCookie = cookieStore.get("diagnosis_result");

  let diagnosis: Diagnosis | null = null;

  try {
    if (diagnosisCookie?.value) {
      diagnosis = JSON.parse(diagnosisCookie.value) as Diagnosis;
    }
  } catch (error) {
    console.error("Error parsing diagnosis cookie:", error);
  }

  // If no diagnosis is found, use a fallback
  if (!diagnosis) {
    diagnosis = {
      primaryDiagnosis: {
        name: "Common Cold (Rhinovirus)",
        description: "A viral infection of the upper respiratory tract that primarily affects the nose and throat.",
        icdCode: "J00"
      },
      reasoning: "Based on the reported symptoms of nasal congestion, sore throat, mild fever, and duration of 3 days, the most likely diagnosis is a common cold. The absence of severe symptoms like high fever, extreme fatigue, or difficulty breathing makes influenza or COVID-19 less likely. The gradual onset and constellation of upper respiratory symptoms are classic for rhinovirus infection, which is the predominant cause of common colds.",
      citations: [
        {
          title: "Journal of Infectious Diseases (2018)",
          url: "https://academic.oup.com/jid/article/217/7/1057/4794640"
        },
        {
          title: "New England Journal of Medicine (2020)",
          url: "https://www.nejm.org/doi/full/10.1056/NEJMcp1905181"
        },
        {
          title: "CDC Guidelines (2023)",
          url: "https://www.cdc.gov/features/rhinoviruses/index.html"
        }
      ]
    };
  }

  return (
    <>
      <SubNavbar title="Diagnosis Results" />
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground mb-8">
            Based on the symptoms you provided, our AI has analyzed your condition and generated the following diagnosis.
            Please consult with a healthcare professional for a definitive diagnosis.
          </p>

          <div className="space-y-8">
          {/* Primary Diagnosis Card */}
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-xl">Primary Diagnosis</CardTitle>
              <CardDescription>Most likely condition based on your symptoms</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">{diagnosis.primaryDiagnosis.name}</h3>
              <p className="text-muted-foreground mb-4">
                {diagnosis.primaryDiagnosis.description}
              </p>
              <div className="bg-card/50 p-4 rounded-md border border-border/40">
                <h4 className="font-medium mb-2">ICD-10 Code: {diagnosis.primaryDiagnosis.icdCode}</h4>
                <p className="text-sm text-muted-foreground">
                  International Classification of Diseases, 10th Revision
                </p>
              </div>

              {diagnosis.primaryDiagnosis.severity && (
                <div className="mt-4">
                  <h4 className="font-medium mb-1">Severity</h4>
                  <p className="text-sm">{diagnosis.primaryDiagnosis.severity}</p>
                </div>
              )}

              {diagnosis.primaryDiagnosis.commonSymptoms && diagnosis.primaryDiagnosis.commonSymptoms.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-1">Common Symptoms</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {diagnosis.primaryDiagnosis.commonSymptoms.map((symptom, index) => (
                      <li key={index}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Differential Diagnoses Card */}
          {diagnosis.differentialDiagnoses && diagnosis.differentialDiagnoses.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl">Differential Diagnoses</CardTitle>
                <CardDescription>Other conditions to consider</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {diagnosis.differentialDiagnoses.map((diff, index) => (
                    <div key={index} className="p-3 border border-border/40 rounded-md">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{diff.name}</h4>
                        <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {diff.likelihood}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">ICD-10: {diff.icdCode}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reasoning Card */}
          <Card>
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-xl">Diagnostic Reasoning</CardTitle>
              <CardDescription>How the AI reached this conclusion</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap">
                {diagnosis.reasoning.split('\n').map((paragraph, index) => (
                  <p key={index} className={index < diagnosis.reasoning.split('\n').length - 1 ? "mb-4" : ""}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Medication Plan Card */}
          {diagnosis.medicationPlan && diagnosis.medicationPlan.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl">Medication Recommendations</CardTitle>
                <CardDescription>Suggested treatments for your condition</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {diagnosis.medicationPlan.map((med, index) => (
                    <div key={index} className="p-4 border border-border/40 rounded-md">
                      <h4 className="font-medium text-primary">{med.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <p className="text-sm font-medium">Purpose</p>
                          <p className="text-sm text-muted-foreground">{med.purpose}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Dosage</p>
                          <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Timing</p>
                          <p className="text-sm text-muted-foreground">{med.timing}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Duration</p>
                          <p className="text-sm text-muted-foreground">{med.duration}</p>
                        </div>
                      </div>
                      {med.notes && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-sm text-muted-foreground">{med.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-md">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Important:</strong> These medication recommendations are for informational purposes only.
                    Always consult with a healthcare provider before starting any medication.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Recommendations Card */}
          {diagnosis.testRecommendations && diagnosis.testRecommendations.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl">Recommended Tests</CardTitle>
                <CardDescription>Diagnostic tests that may be helpful</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {diagnosis.testRecommendations.map((test, index) => (
                    <div key={index} className="p-3 border border-border/40 rounded-md">
                      <h4 className="font-medium">{test.testName}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{test.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lifestyle Advice Card */}
          {diagnosis.lifestyleAdvice && diagnosis.lifestyleAdvice.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl">Lifestyle Recommendations</CardTitle>
                <CardDescription>Suggestions to help manage your condition</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  {diagnosis.lifestyleAdvice.map((advice, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                        <span className="text-xs">✓</span>
                      </div>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Card */}
          {diagnosis.followUp && (
            <Card>
              <CardHeader className="border-b border-border/40">
                <CardTitle className="text-xl">Follow-up Recommendations</CardTitle>
                <CardDescription>Next steps for your care</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p>{diagnosis.followUp}</p>
              </CardContent>
            </Card>
          )}

          {/* Citations Card */}
          <Card>
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-xl">Medical Citations</CardTitle>
              <CardDescription>Research supporting this diagnosis</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {diagnosis.citations.map((citation, index) => (
                <div key={index}>
                  <h4 className="font-medium flex items-center gap-2">
                    {citation.title}
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex items-center"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Open in new tab</span>
                    </a>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-muted-foreground/80"
                    >
                      {citation.url.length > 60 ? `${citation.url.substring(0, 60)}...` : citation.url}
                    </a>
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/diagnosis">Start New Diagnosis</Link>
          </Button>
          <Button variant="outline" className="flex-1">
            Save Results
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-md">
            <p className="text-sm text-primary">
              <strong>Demo Mode:</strong> This application is currently running in demo mode with simulated diagnoses.
              To enable real AI-powered diagnoses, a valid Perplexity API key needs to be configured.
            </p>
          </div>

          <div className="p-4 bg-card/30 border border-border/40 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This AI-generated diagnosis is for informational purposes only and should not replace professional medical advice.
              Always consult with a qualified healthcare provider for proper diagnosis and treatment of medical conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
