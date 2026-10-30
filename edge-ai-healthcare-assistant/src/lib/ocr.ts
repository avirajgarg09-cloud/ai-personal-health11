"use client";

// Local/edge OCR using Tesseract.js (WASM) — runs entirely on-device so
// prescription and report scanning works even with zero connectivity.
export type OcrProgress = { status: string; progress: number };

export async function recognizeImageText(
  file: File | Blob,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  // Self-hosted worker/core/language files (see public/tesseract*) so OCR
  // keeps working fully on-device after the first load — no dependency on a
  // third-party CDN at runtime, matching the offline-first requirement.
  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/tesseract-core-lstm.wasm.js",
    langPath: "/tesseract-lang",
    logger: (m) => {
      if (onProgress) onProgress({ status: m.status, progress: m.progress ?? 0 });
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
