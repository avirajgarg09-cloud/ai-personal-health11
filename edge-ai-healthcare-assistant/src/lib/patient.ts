// A patient identity is just a client-generated UUID — no login required.
// It is created on first run, persisted to localStorage, and used as the
// foreign key for every record synced to Postgres.
const STORAGE_KEY = "vitaledge.patientId";

export function getPatientId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function newClientId(prefix = "rec"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
