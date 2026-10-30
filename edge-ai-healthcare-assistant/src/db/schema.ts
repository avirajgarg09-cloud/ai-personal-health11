// Keep the schema entrypoint present so models can define tables and run
// `npx drizzle-kit push` without bootstrapping Drizzle config first.
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// A single logical "patient" maps 1:1 to a browser/device identity (clientId,
// a uuid generated on first launch and kept in localStorage + IndexedDB).
// No login is required for the hackathon demo — the clientId is the identity.
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: varchar("gender", { length: 32 }),
  bloodGroup: varchar("blood_group", { length: 8 }),
  phone: varchar("phone", { length: 32 }),
  conditions: text("conditions"),
  allergies: text("allergies"),
  medications: text("medications"),
  language: varchar("language", { length: 16 }).default("en"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vitals = pgTable("vitals", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 64 }).notNull().unique(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // blood_pressure | blood_sugar | heart_rate | weight | spo2 | temperature
  systolic: numeric("systolic"),
  diastolic: numeric("diastolic"),
  value: numeric("value"),
  unit: varchar("unit", { length: 16 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  source: varchar("source", { length: 16 }).default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 64 }).notNull().unique(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // prescription | report | scribe
  title: text("title"),
  rawText: text("raw_text"),
  summary: jsonb("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 64 }).notNull().unique(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  doctorName: text("doctor_name").notNull(),
  department: varchar("department", { length: 64 }),
  slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 16 }).default("pending"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  role: varchar("role", { length: 16 }).notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
