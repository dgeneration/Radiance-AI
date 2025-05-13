"use client";

import { FileManager } from "@/components/file-upload/file-manager";
import { AnimatedDashboardSection } from "@/components/dashboard";
import { FolderOpen } from "lucide-react";

interface FileManagerContainerProps {
  userId: string;
}

export function FileManagerContainer({ userId }: FileManagerContainerProps) {
  return (
    <AnimatedDashboardSection delay={0.2}>
      <div className="bg-card/30 backdrop-blur-sm border border-primary/10 p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                File Manager
              </h2>
              <p className="text-muted-foreground">
                Upload and manage your medical files and reports
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 p-5 rounded-xl shadow-md">
            <FileManager userId={userId} />
          </div>

          <div className="p-4 bg-card/30 border border-border/40 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Files uploaded here can be attached to your diagnosis requests.
              Supported file types include images (JPG, PNG, GIF) and documents (PDF, DOC, DOCX, TXT).
              Maximum file size is 10MB.
            </p>
          </div>
        </div>
      </div>
    </AnimatedDashboardSection>
  );
}
