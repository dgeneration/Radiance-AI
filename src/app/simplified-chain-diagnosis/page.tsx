"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Brain } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import { SimplifiedChainDiagnosisProvider, useSimplifiedChainDiagnosis } from '@/contexts/simplified-chain-diagnosis-context';
import { SubNavbar } from '@/components/sub-navbar';

// Form schema
const formSchema = z.object({
  symptoms: z.string().min(3, {
    message: "Please describe your symptoms in more detail",
  }),
  age: z.string().min(1, {
    message: "Age is required",
  }),
  gender: z.string().min(1, {
    message: "Gender is required",
  }),
  duration: z.string().min(1, {
    message: "Duration is required",
  }),
  medicalHistory: z.string().optional(),
  medicalReport: z.string().optional(),
});

function SimplifiedChainDiagnosisForm() {
  const { startNewSession, isLoading } = useSimplifiedChainDiagnosis();
  const router = useRouter();
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: "",
      age: "",
      gender: "",
      duration: "",
      medicalHistory: "",
      medicalReport: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Create a simplified user profile
      const userProfile = {
        first_name: "Test",
        last_name: "User",
        gender: values.gender,
        birth_year: new Date().getFullYear() - parseInt(values.age),
        age: parseInt(values.age),
        health_history: values.medicalHistory,
      };
      
      // Create simplified symptom data
      const symptomData = {
        symptoms: values.symptoms,
        gender: values.gender,
        age: values.age,
        duration: values.duration,
        medicalHistory: values.medicalHistory,
      };
      
      // Create a medical report if provided
      const selectedFiles = values.medicalReport ? [{
        id: "test-file",
        name: "Medical Report.txt",
        type: "text/plain",
        size: values.medicalReport.length,
        path: "test-path",
        created_at: new Date().toISOString(),
        public_url: null,
        text: values.medicalReport,
      }] : undefined;
      
      const sessionId = await startNewSession(
        "test-user-id",
        userProfile,
        symptomData,
        selectedFiles
      );
      
      if (sessionId) {
        router.push(`/simplified-chain-diagnosis/${sessionId}`);
      }
    } catch (error) {
      console.error('Error starting chain diagnosis session:', error);
    }
  };
  
  return (
    <AnimatedSection>
      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Simplified Chain Diagnosis</CardTitle>
              <CardDescription>
                Get a comprehensive analysis from 8 specialized AI roles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symptoms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your symptoms in detail"
                        className="min-h-[100px] bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate multiple symptoms with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Age"
                          className="bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 3 days, 2 weeks"
                          className="bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any relevant medical history, conditions, or medications"
                        className="min-h-[80px] bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="medicalReport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Report (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your medical report text here"
                        className="min-h-[150px] bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste the text of your medical report for analysis by the Medical Analyst AI
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Diagnosis...
                  </>
                ) : (
                  "Start Chain Diagnosis"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col text-xs text-muted-foreground border-t border-border/50 pt-4">
          <p>
            The Multi-Agent Chain Diagnosis System uses 8 specialized AI roles to provide a comprehensive health analysis.
          </p>
          <p className="mt-1">
            This is not a substitute for professional medical advice. Always consult a healthcare provider.
          </p>
        </CardFooter>
      </Card>
    </AnimatedSection>
  );
}

export default function SimplifiedChainDiagnosisPage() {
  return (
    <SimplifiedChainDiagnosisProvider>
      <SubNavbar title="Simplified Chain Diagnosis" showProfileNav={true} />
      <div className="relative overflow-hidden py-10 px-4">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-accent/5 z-0"></div>

        <div className="container relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Simplified Chain Diagnosis System
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This is a simplified version of the Chain Diagnosis System that doesn't rely on the database.
              It demonstrates the Medical Analyst AI component.
            </p>
          </div>

          <SimplifiedChainDiagnosisForm />
        </div>
      </div>
    </SimplifiedChainDiagnosisProvider>
  );
}
