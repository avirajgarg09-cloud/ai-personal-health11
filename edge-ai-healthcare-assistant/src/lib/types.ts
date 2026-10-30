export type Profile = {
  clientId: string;
  name: string;
  age: number | null;
  gender: string | null;
  bloodGroup: string | null;
  phone: string | null;
  conditions: string | null;
  allergies: string | null;
  medications: string | null;
  language: string;
  updatedAt: string;
};

export type VitalType =
  | "blood_pressure"
  | "blood_sugar"
  | "heart_rate"
  | "weight"
  | "spo2"
  | "temperature";

export type Vital = {
  clientId: string;
  patientId: string;
  type: VitalType;
  systolic?: number | null;
  diastolic?: number | null;
  value?: number | null;
  unit?: string | null;
  recordedAt: string;
  source: "manual" | "report";
  createdAt: string;
};

export type DocumentType = "prescription" | "report" | "scribe";

export type MedicineInfo = {
  name: string;
  dosage?: string;
  uses: string;
  sideEffects: string;
};

export type DocumentSummary = {
  headline: string;
  plainSummary: string;
  medicines?: MedicineInfo[];
  keyFindings?: { label: string; value: string; status?: "normal" | "watch" | "high" | "low" }[];
  recommendations?: string[];
  soap?: { subjective: string; objective: string; assessment: string; plan: string };
};

export type HealthDocument = {
  clientId: string;
  patientId: string;
  type: DocumentType;
  title: string;
  rawText: string;
  summary: DocumentSummary | null;
  createdAt: string;
};

export type Appointment = {
  clientId: string;
  patientId: string;
  doctorName: string;
  department: string;
  slotStart: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  updatedAt: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type OutboxEntity = "profile" | "vital" | "document" | "appointment";

export type OutboxItem = {
  id: string;
  entity: OutboxEntity;
  payload: unknown;
  createdAt: string;
  attempts: number;
};
