"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  User, Calendar, Clock, MapPin, AlertTriangle,
  Activity, FileText, TestTube, Pill, Utensils,
  CalendarCheck, ShieldAlert, Info, CheckCircle,
  XCircle, AlertCircle
} from 'lucide-react';
import { AnimatedIcon } from '@/components/animations';

// Define the response type based on the provided JSON
interface HealthInsightReportProps {
  report: {
    age: number;
    gender: string;
    disclaimer: string;
    patient_id: string;
    patient_name: string;
    date_of_report: string;
    introduction?: string;
    follow_up_plan: {
      timeline: string;
      specialist_referral: string;
      documentation_needed: string;
    };
    primary_concerns: string[];
    recommended_tests: string[];
    medication_guidance: {
      current_medications: string[];
      medications_to_avoid: string[];
      potential_medications: string[];
    };
    potential_diagnoses: {
      name: string;
      description: string;
      confidence_level: string;
      symptoms_matched: string[];
      symptoms_not_matched: string[];
    }[];
    condition_summary: string;
    urgent_care_indicators: {
      present: boolean;
      indicators: string[];
    };
    dietary_recommendations: string[];
    lifestyle_recommendations: string[];
  };
  className?: string;
}

export function HealthInsightReport({ report, className }: HealthInsightReportProps) {
  // Helper function to render confidence level badge
  const renderConfidenceBadge = (level?: string) => {
    // If level is undefined or null, return a default badge
    if (!level) {
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30">
          Unknown
        </Badge>
      );
    }

    switch (level.toLowerCase()) {
      case 'high':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            High Confidence
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            Medium Confidence
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            Low Confidence
          </Badge>
        );
      default:
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {level}
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Patient Information Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl opacity-20"></div>

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-md">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{report.patient_name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{report.date_of_report}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{report.age} years, {report.gender}</span>
                  </div>
                  {report.patient_id && (
                    <div className="flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      <span>ID: {report.patient_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {report.urgent_care_indicators.present && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-500">Urgent Care Indicators Present</p>
                  <ul className="text-sm mt-1 space-y-1">
                    {report.urgent_care_indicators.indicators.map((indicator, i) => (
                      <li key={i} className="text-muted-foreground">{indicator}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Introduction */}
          {report.introduction && (
            <div className="mb-6 bg-card/80 p-4 rounded-lg border border-primary/10">
              <p className="text-muted-foreground">{report.introduction}</p>
            </div>
          )}

          {/* Potential Diagnoses */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <AnimatedIcon
                  icon={<FileText className="h-4 w-4 text-primary" />}
                  delay={0.1}
                />
              </div>
              <h3 className="text-lg font-medium">Potential Diagnoses</h3>
            </div>

            <div className="space-y-4">
              {Array.isArray(report.potential_diagnoses) ? (
                report.potential_diagnoses.map((diagnosis, i) => (
                  <div key={i} className="bg-card/30 rounded-lg p-4 border border-primary/5">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-3">
                      <h4 className="font-medium">{diagnosis.name || 'Unknown Diagnosis'}</h4>
                      {renderConfidenceBadge(diagnosis.confidence_level)}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{diagnosis.description || 'No description available'}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-2 text-green-500">Symptoms Matched</p>
                        <ul className="space-y-1">
                          {Array.isArray(diagnosis.symptoms_matched) && diagnosis.symptoms_matched.length > 0 ? (
                            diagnosis.symptoms_matched.map((symptom, j) => (
                              <li key={j} className="text-xs flex items-start gap-1.5">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{symptom}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-muted-foreground">No matched symptoms</li>
                          )}
                        </ul>
                      </div>

                      {Array.isArray(diagnosis.symptoms_not_matched) && diagnosis.symptoms_not_matched.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2 text-red-500">Symptoms Not Matched</p>
                          <ul className="space-y-1">
                            {diagnosis.symptoms_not_matched.map((symptom, j) => (
                              <li key={j} className="text-xs flex items-start gap-1.5">
                                <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-card/30 rounded-lg p-4 border border-primary/5">
                  <p className="text-sm text-muted-foreground">No potential diagnoses available</p>
                </div>
              )}
            </div>
          </div>

          {/* Condition Summary */}
          {report.condition_summary && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <AnimatedIcon
                    icon={<Activity className="h-4 w-4 text-accent" />}
                    delay={0.2}
                  />
                </div>
                <h3 className="text-lg font-medium">Condition Summary</h3>
              </div>

              <div className="bg-card/30 rounded-lg p-4 border border-accent/5">
                <p className="text-muted-foreground">{report.condition_summary}</p>
              </div>
            </div>
          )}

          {/* Primary Concerns */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <AnimatedIcon
                  icon={<AlertCircle className="h-4 w-4 text-accent" />}
                  delay={0.3}
                />
              </div>
              <h3 className="text-lg font-medium">Primary Concerns</h3>
            </div>

            <div className="bg-card/30 rounded-lg p-4 border border-accent/5">
              <ul className="space-y-2">
                {Array.isArray(report.primary_concerns) && report.primary_concerns.length > 0 ? (
                  report.primary_concerns.map((concern, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{concern}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No primary concerns identified</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommended Tests */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <AnimatedIcon
                  icon={<TestTube className="h-4 w-4 text-primary" />}
                  delay={0.4}
                />
              </div>
              <h3 className="text-lg font-medium">Recommended Tests</h3>
            </div>

            <div className="bg-card/30 rounded-lg p-4 border border-primary/5">
              <ul className="space-y-2">
                {Array.isArray(report.recommended_tests) && report.recommended_tests.length > 0 ? (
                  report.recommended_tests.map((test, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      </div>
                      <span className="text-muted-foreground">{test}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No recommended tests</li>
                )}
              </ul>
            </div>
          </div>

          {/* Medication Guidance */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <AnimatedIcon
                  icon={<Pill className="h-4 w-4 text-accent" />}
                  delay={0.5}
                />
              </div>
              <h3 className="text-lg font-medium">Medication Guidance</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card/30 rounded-lg p-4 border border-accent/5">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Current Medications
                </p>
                <ul className="space-y-1">
                  {report.medication_guidance.current_medications.length > 0 ? (
                    report.medication_guidance.current_medications.map((med, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{med}</li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">None specified</li>
                  )}
                </ul>
              </div>

              <div className="bg-card/30 rounded-lg p-4 border border-accent/5">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Medications to Avoid
                </p>
                <ul className="space-y-1">
                  {report.medication_guidance.medications_to_avoid.length > 0 ? (
                    report.medication_guidance.medications_to_avoid.map((med, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{med}</li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">None specified</li>
                  )}
                </ul>
              </div>

              <div className="bg-card/30 rounded-lg p-4 border border-accent/5">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Potential Medications
                </p>
                <ul className="space-y-1">
                  {report.medication_guidance.potential_medications.length > 0 ? (
                    report.medication_guidance.potential_medications.map((med, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{med}</li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">None specified</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Dietary & Lifestyle Recommendations */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <AnimatedIcon
                  icon={<Utensils className="h-4 w-4 text-primary" />}
                  delay={0.6}
                />
              </div>
              <h3 className="text-lg font-medium">Dietary & Lifestyle Recommendations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card/30 rounded-lg p-4 border border-primary/5">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  Dietary Recommendations
                </p>
                <ul className="space-y-2">
                  {Array.isArray(report.dietary_recommendations) && report.dietary_recommendations.length > 0 ? (
                    report.dietary_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{rec}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No dietary recommendations</li>
                  )}
                </ul>
              </div>

              <div className="bg-card/30 rounded-lg p-4 border border-primary/5">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Lifestyle Recommendations
                </p>
                <ul className="space-y-2">
                  {Array.isArray(report.lifestyle_recommendations) && report.lifestyle_recommendations.length > 0 ? (
                    report.lifestyle_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{rec}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No lifestyle recommendations</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Follow-up Plan */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <AnimatedIcon
                  icon={<CalendarCheck className="h-4 w-4 text-accent" />}
                  delay={0.7}
                />
              </div>
              <h3 className="text-lg font-medium">Follow-up Plan</h3>
            </div>

            <div className="bg-card/30 rounded-lg p-4 border border-accent/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-sm text-muted-foreground">{report.follow_up_plan.timeline}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Specialist Referral</p>
                  <p className="text-sm text-muted-foreground">{report.follow_up_plan.specialist_referral}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Documentation Needed</p>
                  <p className="text-sm text-muted-foreground">{report.follow_up_plan.documentation_needed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          {report.disclaimer && (
            <div className="bg-card/80 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Medical Disclaimer:</p>
                  <p>{report.disclaimer}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
