"use client";

import { PageHeader } from "@/components/ui";
import { DocumentScanner } from "@/components/document-scanner";

export default function PrescriptionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Prescription Analyzer"
        title="Understand your prescription in seconds"
        description="On-device OCR extracts the text, then VitalEdge AI explains each medicine's uses and side effects in plain language."
      />
      <DocumentScanner
        docType="prescription"
        title="Upload prescription"
        helperText="Take a photo of a handwritten or printed prescription."
        accentLabel="AI medicine breakdown"
      />
    </div>
  );
}
