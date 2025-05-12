"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Upload, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { AnimatedSection } from '@/components/animations';
import Link from 'next/link';
import { testMedicalAnalyst } from '@/lib/test-api';

export default function TestMedicalAnalystPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('Blood Test');
  const [reportName, setReportName] = useState('Test Report');
  const [imageUrl, setImageUrl] = useState('');
  const [useDirectImageUrl, setUseDirectImageUrl] = useState(false);
  const [apiRequest, setApiRequest] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('form');

  // Sample reports for quick testing
  const sampleReports = {
    bloodTest: {
      type: 'Blood Test',
      name: 'Complete Blood Count (CBC)',
      text: `COMPLETE BLOOD COUNT (CBC)
Patient: John Doe
Age: 35
Gender: Male
Date: 2023-06-15

TEST               RESULT        REFERENCE RANGE
WBC                12.5 K/uL     4.5-11.0 K/uL    HIGH
RBC                4.8 M/uL      4.5-5.9 M/uL     NORMAL
Hemoglobin         14.2 g/dL     13.5-17.5 g/dL   NORMAL
Hematocrit         42%           41-53%           NORMAL
MCV                88 fL         80-100 fL        NORMAL
MCH                29.5 pg       27-31 pg         NORMAL
MCHC               33.8 g/dL     32-36 g/dL       NORMAL
Platelets          450 K/uL      150-450 K/uL     HIGH NORMAL
Neutrophils        75%           40-60%           HIGH
Lymphocytes        15%           20-40%           LOW
Monocytes          8%            2-8%             NORMAL
Eosinophils        2%            1-4%             NORMAL
Basophils          0%            0-1%             NORMAL

COMMENTS:
Elevated white blood cell count with neutrophilia suggests possible bacterial infection.
Platelet count at upper limit of normal range.`
    },
    liverFunction: {
      type: 'Liver Function Test',
      name: 'Comprehensive Metabolic Panel',
      text: `LIVER FUNCTION TESTS
Patient: Jane Smith
Age: 42
Gender: Female
Date: 2023-06-10

TEST                           RESULT        REFERENCE RANGE
Total Bilirubin                1.8 mg/dL     0.1-1.2 mg/dL     HIGH
Direct Bilirubin               0.4 mg/dL     0.0-0.3 mg/dL     HIGH
Indirect Bilirubin             1.4 mg/dL     0.1-0.9 mg/dL     HIGH
Alkaline Phosphatase (ALP)     142 U/L       40-130 U/L        HIGH
Aspartate Aminotransferase     65 U/L        5-40 U/L          HIGH
Alanine Aminotransferase       75 U/L        7-56 U/L          HIGH
Gamma-Glutamyl Transferase     80 U/L        8-61 U/L          HIGH
Total Protein                  7.2 g/dL      6.0-8.3 g/dL      NORMAL
Albumin                        3.8 g/dL      3.5-5.0 g/dL      NORMAL
Globulin                       3.4 g/dL      2.3-3.5 g/dL      NORMAL
Albumin/Globulin Ratio         1.1           1.1-2.5           NORMAL

COMMENTS:
Elevated liver enzymes and bilirubin levels suggest hepatocellular injury. Further investigation recommended.`
    },
    imageReport: {
      type: 'Imaging Report',
      name: 'Chest X-Ray with Image URL',
      text: `RADIOLOGY REPORT: CHEST X-RAY
Patient: Robert Johnson
Age: 45
Gender: Male
Date: 2023-07-20

CLINICAL INDICATION: Shortness of breath, cough for 2 weeks

TECHNIQUE: PA and lateral views of the chest were obtained.

IMAGE URL: https://www.radiologyinfo.org/gallery-items/images/chest-xray.jpg

FINDINGS:
- Lung fields: Patchy opacity in the right lower lobe consistent with pneumonia
- Heart size: Normal cardiac silhouette
- Mediastinum: No widening
- Pleural spaces: Small right pleural effusion
- Bony structures: No acute abnormalities

IMPRESSION:
1. Right lower lobe pneumonia with small pleural effusion
2. No evidence of malignancy or tuberculosis
3. Normal cardiac size

RECOMMENDATION:
1. Clinical correlation and follow-up
2. Repeat imaging in 4-6 weeks after treatment to ensure resolution`
    },
    mriReport: {
      type: 'Imaging Report',
      name: 'Brain MRI with Image URL',
      text: `RADIOLOGY REPORT: BRAIN MRI
Patient: Sarah Williams
Age: 52
Gender: Female
Date: 2023-08-05

CLINICAL INDICATION: Recurrent headaches, visual disturbances

TECHNIQUE: MRI of the brain was performed with and without contrast.

IMAGE URL: https://www.radiologyinfo.org/gallery-items/images/brain-mri.jpg

FINDINGS:
- Brain parenchyma: 2.3 cm enhancing mass in the right parietal lobe with surrounding edema
- Ventricles: Mild compression of the right lateral ventricle
- Midline structures: No midline shift
- Vascular structures: Normal flow voids
- Sinuses: Clear
- Skull base: Unremarkable

IMPRESSION:
1. 2.3 cm enhancing mass in the right parietal lobe, most consistent with primary brain tumor (likely glioma)
2. Surrounding vasogenic edema
3. No evidence of hemorrhage or infarct

RECOMMENDATION:
1. Neurosurgical consultation for possible biopsy
2. Clinical correlation with patient's symptoms
3. Consider advanced imaging with spectroscopy and perfusion studies`
    },
    ecgReport: {
      type: 'Cardiology Report',
      name: 'ECG Report with Image URL',
      text: `CARDIOLOGY REPORT: ELECTROCARDIOGRAM (ECG)
Patient: Michael Brown
Age: 65
Gender: Male
Date: 2023-09-10

CLINICAL INDICATION: Chest pain, shortness of breath

TECHNIQUE: Standard 12-lead electrocardiogram

IMAGE URL: https://cdn.pixabay.com/photo/2013/07/18/10/59/heartbeat-163709_1280.jpg

FINDINGS:
- Rhythm: Sinus rhythm at 88 bpm
- Intervals: PR 180ms, QRS 110ms, QT 420ms
- Axis: Normal
- ST-T changes: 2mm ST-segment elevation in leads II, III, aVF
- Q waves: Present in leads III and aVF
- Other: Reciprocal ST depression in leads I and aVL

IMPRESSION:
1. Acute inferior wall myocardial infarction
2. Sinus tachycardia
3. No evidence of high-grade AV block

RECOMMENDATION:
1. Immediate cardiology consultation
2. Consider urgent coronary angiography
3. Serial cardiac enzymes and ECG monitoring`
    },
    ultrasoundReport: {
      type: 'Imaging Report',
      name: 'Abdominal Ultrasound with Image URL',
      text: `RADIOLOGY REPORT: ABDOMINAL ULTRASOUND
Patient: Emily Johnson
Age: 38
Gender: Female
Date: 2023-07-25

CLINICAL INDICATION: Right upper quadrant pain, elevated liver enzymes

TECHNIQUE: Complete abdominal ultrasound examination was performed.

IMAGE URL: https://cdn.pixabay.com/photo/2019/06/18/01/06/ultrasound-4281704_1280.jpg

FINDINGS:
- Liver: Mildly enlarged with increased echogenicity consistent with fatty infiltration. Multiple hypoechoic lesions in the right lobe, largest measuring 2.1 cm.
- Gallbladder: Multiple mobile gallstones noted. No wall thickening or pericholecystic fluid.
- Bile ducts: Common bile duct measures 6mm in diameter. No intrahepatic biliary dilatation.
- Pancreas: Normal in size and echogenicity. No masses or ductal dilatation.
- Spleen: Normal size and echogenicity.
- Kidneys: Normal size and echogenicity. No hydronephrosis or calculi.
- Other: Small amount of free fluid in the right lower quadrant.

IMPRESSION:
1. Multiple hepatic lesions concerning for metastatic disease
2. Cholelithiasis without evidence of acute cholecystitis
3. Hepatic steatosis
4. Small amount of free fluid in the right lower quadrant

RECOMMENDATION:
1. Contrast-enhanced CT or MRI of the abdomen for further characterization of liver lesions
2. Correlation with tumor markers
3. Surgical consultation for symptomatic cholelithiasis`
    }
  };

  // Load a sample report
  const loadSampleReport = (reportKey: keyof typeof sampleReports) => {
    const sample = sampleReports[reportKey];
    setReportType(sample.type);
    setReportName(sample.name);
    setReportText(sample.text);
  };

  // Process the medical analyst request
  const processRequest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setApiRequest(null);
      setApiResponse(null);

      // Create a session ID for testing
      const sessionId = `test-${Date.now()}`;

      // Create the user input object
      const userInput = {
        user_details: {
          age: 35,
          gender: 'male',
          height: 175,
          weight: 70
        },
        symptoms_info: {
          symptoms_list: ['Fatigue', 'Headache'],
          duration_number: 7,
          duration_unit: 'days'
        },
        medical_info: {
          medical_conditions: 'None',
          medications: 'None',
          allergies: 'None'
        },
        medical_report: useDirectImageUrl
          ? {
              text: `This is a medical image for analysis.${reportText ? `\n\nAdditional context: ${reportText}` : ''}`,
              type: reportType,
              name: reportName,
              image_url: imageUrl // Add the direct image URL
            }
          : {
              text: reportText,
              type: reportType,
              name: reportName
            }
      };

      console.log('Processing test medical analyst request...');

      // Process the medical analyst request using the test API
      const result = await testMedicalAnalyst(
        sessionId,
        userInput
      );

      console.log('Test medical analyst request processed successfully');

      // Store the API request and response for display
      setApiRequest(result.request);
      setApiResponse({
        rawResponse: result.response,
        parsedResponse: result.parsedResponse
      });

      // Switch to the response tab
      setActiveTab('response');
    } catch (error) {
      console.error('Error processing medical analyst request:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <AnimatedSection>
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Test Medical Analyst API</h1>
        </div>

        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Medical Analyst Test Tool</CardTitle>
            <CardDescription>
              Test the Medical Analyst API with custom medical reports and view the raw request and response.
            </CardDescription>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mx-6">
              <TabsTrigger value="form">Input Form</TabsTrigger>
              <TabsTrigger value="request">API Request</TabsTrigger>
              <TabsTrigger value="response">API Response</TabsTrigger>
            </TabsList>

            <CardContent className="p-6">
              <TabsContent value="form" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-4 p-4 border border-blue-500/20 rounded-lg bg-blue-500/5 mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useDirectImageUrl"
                          checked={useDirectImageUrl}
                          onChange={(e) => setUseDirectImageUrl(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <Label htmlFor="useDirectImageUrl" className="text-blue-500 font-medium">
                          Test with Direct Image URL
                        </Label>
                      </div>
                      <div className="ml-auto text-xs text-muted-foreground">
                        This will send the image URL directly to the API
                      </div>
                    </div>

                    {useDirectImageUrl && (
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl" className="text-blue-500">Image URL</Label>
                        <Input
                          id="imageUrl"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Enter the URL of the medical image to analyze"
                          className="bg-card/50 border-blue-500/20"
                        />

                        {imageUrl && (
                          <div className="mt-2 border border-border/50 rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt="Medical Image Preview"
                              className="w-full max-h-[300px] object-contain bg-black/20"
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/600x400/gray/white?text=Image+Load+Error';
                              }}
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </div>
                        )}

                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageUrl('https://www.radiologyinfo.org/gallery-items/images/chest-xray.jpg')}
                            className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                          >
                            Sample X-Ray
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageUrl('https://www.radiologyinfo.org/gallery-items/images/brain-mri.jpg')}
                            className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                          >
                            Sample MRI
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageUrl('https://cdn.pixabay.com/photo/2013/07/18/10/59/heartbeat-163709_1280.jpg')}
                            className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                          >
                            Sample ECG
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Input
                      id="reportType"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="bg-card/50 border-primary/10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      className="bg-card/50 border-primary/10"
                    />
                  </div>

                  <div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="reportText">Report Text</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadSampleReport('bloodTest')}
                            className="text-xs h-7 px-2 border-primary/20"
                          >
                            Load CBC Sample
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => loadSampleReport('liverFunction')}
                            className="text-xs h-7 px-2 border-primary/20"
                          >
                            Load LFT Sample
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadSampleReport('imageReport')}
                          className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                        >
                          X-Ray Report
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadSampleReport('mriReport')}
                          className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                        >
                          MRI Report
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadSampleReport('ecgReport')}
                          className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                        >
                          ECG Report
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadSampleReport('ultrasoundReport')}
                          className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                        >
                          Ultrasound Report
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id="reportText"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      className="min-h-[200px] bg-card/50 border-primary/10"
                      placeholder="Enter the medical report text here..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter the medical report text that you want to analyze. This could be lab results, imaging reports, or any other medical document.
                    </p>

                    {/* Image Preview Section */}
                    {reportText.includes('IMAGE URL:') && (
                      <div className="mt-4 border border-blue-500/20 rounded-lg p-4 bg-blue-500/5">
                        <h4 className="text-sm font-medium text-blue-500 mb-2">Image Preview</h4>
                        <div className="space-y-2">
                          {(() => {
                            const match = reportText.match(/IMAGE URL: (https?:\/\/[^\s]+)/);
                            if (match && match[1]) {
                              const imageUrl = match[1];
                              return (
                                <>
                                  <p className="text-xs text-muted-foreground">
                                    The report contains an image URL. The AI will analyze this image as part of the report.
                                  </p>
                                  <div className="border border-border/50 rounded-lg overflow-hidden">
                                    {/* Using regular img tag instead of Next.js Image component */}
                                    <img
                                      src={imageUrl}
                                      alt="Medical Image"
                                      className="w-full max-h-[300px] object-contain bg-black/20"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/600x400/gray/white?text=Image+Load+Error';
                                      }}
                                      style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                  </div>
                                  <div className="mt-2 flex justify-between items-center">
                                    <a
                                      href={imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:underline"
                                    >
                                      Open image in new tab
                                    </a>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-7 px-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/5"
                                      onClick={() => {
                                        // Create a temporary textarea to copy the URL
                                        const textarea = document.createElement('textarea');
                                        textarea.value = imageUrl;
                                        document.body.appendChild(textarea);
                                        textarea.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(textarea);
                                        alert('Image URL copied to clipboard!');
                                      }}
                                    >
                                      Copy Image URL
                                    </Button>
                                  </div>
                                  <p className="text-xs break-all">
                                    <span className="font-medium">URL:</span> {imageUrl}
                                  </p>
                                </>
                              );
                            }
                            return (
                              <p className="text-xs text-muted-foreground">
                                No valid image URL found in the report.
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Error</span>
                      </div>
                      <p className="mt-2 ml-6">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={processRequest}
                    disabled={isLoading || (useDirectImageUrl ? !imageUrl : !reportText)}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : useDirectImageUrl ? (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Analyze Medical Image
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Process Medical Report
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="request">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">API Request</h3>

                  {apiRequest ? (
                    <>
                      {/* User Input */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          User Input
                        </h4>
                        <div className="bg-card/50 border border-primary/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {JSON.stringify(apiRequest.userInput, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* System Prompt */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-500" />
                          System Prompt
                        </h4>
                        <div className="bg-card/50 border border-amber-500/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {apiRequest.systemPrompt}
                          </pre>
                        </div>
                      </div>

                      {/* User Prompt */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          User Prompt
                        </h4>
                        <div className="bg-card/50 border border-blue-500/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {apiRequest.userPrompt}
                          </pre>
                        </div>
                      </div>

                      {/* API Request */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          API Request
                        </h4>
                        <div className="bg-card/50 border border-purple-500/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {JSON.stringify(apiRequest.apiRequest, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Image URL (if present) */}
                      {useDirectImageUrl && imageUrl && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Image URL
                          </h4>
                          <div className="bg-card/50 border border-blue-500/10 rounded-lg p-4">
                            <div className="flex flex-col gap-4">
                              <div className="border border-border/50 rounded-lg overflow-hidden">
                                <img
                                  src={imageUrl}
                                  alt="Medical Image"
                                  className="w-full max-h-[200px] object-contain bg-black/20"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/600x400/gray/white?text=Image+Load+Error';
                                  }}
                                  style={{ maxWidth: '100%', height: 'auto' }}
                                />
                              </div>
                              <div className="text-xs break-all">
                                <span className="font-medium">URL:</span> {imageUrl}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                This image URL is being sent to the Perplexity API for analysis.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No request has been made yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="response">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">API Response</h3>

                  {apiResponse ? (
                    <>
                      {/* Raw API Response */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Raw API Response
                        </h4>
                        <div className="bg-card/50 border border-primary/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {JSON.stringify(apiResponse.rawResponse, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Parsed Response */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Parsed Response
                        </h4>
                        <div className="bg-card/50 border border-green-500/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {JSON.stringify(apiResponse.parsedResponse, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Response Content */}
                      {apiResponse.rawResponse?.choices?.[0]?.message?.content && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Raw Content
                          </h4>
                          <div className="bg-card/50 border border-blue-500/10 rounded-lg p-4 overflow-auto max-h-[300px]">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {apiResponse.rawResponse.choices[0].message.content}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No response has been received yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardFooter className="border-t border-border/50 p-6">
            <p className="text-xs text-muted-foreground">
              This is a test tool for the Medical Analyst API. It allows you to test the API with custom medical reports and view the raw request and response.
            </p>
          </CardFooter>
        </Card>
      </AnimatedSection>
    </div>
  );
}
