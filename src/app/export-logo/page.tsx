"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";

export default function ExportLogoPage() {
  const logoRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const exportLogo = async () => {
    if (!logoRef.current) return;

    setIsExporting(true);

    try {
      // First ensure the image is loaded
      const img = logoRef.current.querySelector('img');
      if (img) {
        // Make sure image is loaded
        if (!img.complete) {
          await new Promise(resolve => {
            img.onload = resolve;
          });
        }
      }

      const canvas = await html2canvas(logoRef.current, {
        width: 512,
        height: 512,
        scale: 2, // Higher scale for better quality
        backgroundColor: null,
        logging: true,
        useCORS: true,
        allowTaint: true,
        onclone: (_document, element) => {
          // Ensure the cloned element has the right dimensions
          const clonedElement = element as HTMLElement;
          clonedElement.style.width = '512px';
          clonedElement.style.height = '512px';
        }
      });

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);

      // Create download link
      const link = document.createElement("a");
      link.download = "RadianceAI_Logo_512x512.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting logo:", error);
      alert("There was an error exporting the logo. Please check the console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  // We don't need to load html2canvas script manually since we're importing it
  useEffect(() => {
    // Preload the logo image to ensure it's ready for capture
    const img = new window.Image();
    img.src = "/RadianceAi_Logo.svg";
    img.crossOrigin = "anonymous";
  }, []);

  return (
    <div className="container mx-auto py-10 px-6 flex flex-col items-center">
      <h1
        className="text-3xl font-bold mb-8 text-transparent"
        style={{
          background: 'linear-gradient(to right, #00C6D7, #1DE9B6)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text'
        }}
      >
        Export Radiance AI Logo (512x512)
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-xl w-full">
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        <p className="text-muted-foreground">
          Click the &quot;Export Logo&quot; button below to capture the logo with its gradient background and download it as a PNG file.
        </p>
      </div>

      {/* Logo container with exact same styling as in header */}
      <div
        ref={logoRef}
        className="w-[512px] h-[512px] rounded-xl relative overflow-hidden mb-8"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: 'rgba(14, 14, 16, 0.8)', // Dark mode background color with 80% opacity
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Header background gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0, 198, 215, 0.05), rgba(29, 233, 182, 0.05))'
          }}
        ></div>

        {/* Logo container gradient - same as in header */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 198, 215, 0.2), rgba(29, 233, 182, 0.2))'
          }}
        ></div>

        {/* Logo image */}
        <div className="relative z-10 w-[400px] h-[400px] flex items-center justify-center">
          <Image
            src="/RadianceAi_Logo.svg"
            alt="Radiance AI Logo"
            width={400}
            height={400}
            className="w-full h-full"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      <button
        onClick={exportLogo}
        disabled={isExporting}
        className="px-6 py-3 rounded-lg mb-8 text-white font-medium"
        style={{
          backgroundColor: '#00C6D7',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          opacity: isExporting ? 0.7 : 1
        }}
      >
        {isExporting ? "Exporting..." : "Export Logo (512x512)"}
      </button>

      {previewUrl && (
        <div className="mt-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="border border-gray-200 rounded-lg p-2 bg-white">
            {/* We can't use Next.js Image for dynamic data URLs, so we keep the img tag here */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-lg"
              style={{
                maxWidth: "512px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            The image has been downloaded to your device
          </p>
        </div>
      )}
    </div>
  );
}
