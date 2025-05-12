"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TestTube, AlertCircle } from 'lucide-react';
import { MedicalAnalystResponse } from '@/types/chain-diagnosis';

export default function TestMedicalAnalystPage() {
  const [medicalReport, setMedicalReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MedicalAnalystResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('findings');
  const [showRawJson, setShowRawJson] = useState(false);

  const handleAnalyze = async () => {
    if (!medicalReport.trim()) {
      setError('Please enter a medical report to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-medical-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicalReport }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error analyzing medical report:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Test Medical Analyst AI
      </h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Medical Report Input</CardTitle>
            <CardDescription>
              Enter a medical report to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter medical report text here..."
              className="min-h-[200px]"
              value={medicalReport}
              onChange={(e) => setMedicalReport(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Report"
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Error</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-full">
                  <TestTube className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Medical Analyst Results</CardTitle>
                  <CardDescription>
                    Analysis of your medical report
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Report Type */}
              {result.report_type_analyzed && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Report Type: <span className="font-medium text-foreground">{result.report_type_analyzed}</span>
                  </span>
                </div>
              )}
              
              {/* Tabs for different sections */}
              <Tabs defaultValue="findings" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="findings">Key Findings</TabsTrigger>
                  <TabsTrigger value="abnormalities">Abnormalities</TabsTrigger>
                  <TabsTrigger value="correlation">Clinical Correlation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="findings" className="space-y-4 pt-4">
                  {result.key_findings_from_report?.length ? (
                    <ul className="space-y-2">
                      {result.key_findings_from_report.map((finding, index) => (
                        <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No key findings identified</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="abnormalities" className="space-y-4 pt-4">
                  {result.abnormalities_highlighted?.length ? (
                    <ul className="space-y-2">
                      {result.abnormalities_highlighted.map((abnormality, index) => (
                        <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50 text-amber-500">
                          {abnormality}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No abnormalities identified</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="correlation" className="space-y-4 pt-4">
                  {result.clinical_correlation_points_for_gp?.length ? (
                    <ul className="space-y-2">
                      {result.clinical_correlation_points_for_gp.map((point, index) => (
                        <li key={index} className="bg-background/50 p-3 rounded-md border border-border/50">
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No clinical correlation points available</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {/* Raw JSON toggle */}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowRawJson(!showRawJson)}
                >
                  {showRawJson ? "Hide Raw JSON" : "Show Raw JSON"}
                </Button>
                
                {showRawJson && (
                  <div className="mt-2 bg-background/50 p-3 rounded-md border border-border/50 overflow-x-auto">
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              {/* Disclaimer */}
              {result.disclaimer && (
                <div className="bg-background/50 p-3 rounded-md border border-border/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Disclaimer:</p>
                  <p>{result.disclaimer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
