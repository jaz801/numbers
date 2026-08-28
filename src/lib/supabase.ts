/**
 * Minimal PostgREST client for the np_ tables.
 *
 * Hand-written instead of @supabase/supabase-js: the app needs a select and
 * an insert, and the rest of this repo carries no runtime dependencies it
 * does not use. Every np_ table has a service_role policy only, so this can
 * never run in the browser — the key would be handed to the visitor.
 */

import "server-only";

const REST = "/rest/v1/";

/** Thrown with the status the API route should answer with. */
export class NpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

/** False on a machine without the service-role key; the portal then stays local. */
export function supabaseConfigured(): boolean {
  return env() !== null;
}

function headers(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** PostgREST reports a violated constraint in `code`; 23505 is a duplicate. */
type PostgrestError = { code?: string; message?: string; details?: string };

async function fout(response: Response): Promise<never> {
  let body: PostgrestError = {};
  try {
    body = (await response.json()) as PostgrestError;
  } catch {
    // A non-JSON body (a gateway error page) leaves the status to speak.
  }
  if (body.code === "23505") {
    throw new NpError("Dit staat al in de database.", 409);
  }
  throw new NpError(
    body.message ?? `Supabase antwoordde met ${response.status}.`,
    response.status >= 500 ? 502 : 400,
  );
}

function client() {
  const config = env();
  if (!config) {
    throw new NpError(
      "SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in de omgeving.",
      503,
    );
  }
  return config;
}

/** `query` is a raw PostgREST query string, e.g. `select=*&order=code.asc`. */
export async function npSelect<T>(table: string, query: string): Promise<T[]> {
  const { url, key } = client();
  const response = await fetch(`${url}${REST}${table}?${query}`, {
    headers: headers(key),
    cache: "no-store",
  });
  if (!response.ok) await fout(response);
  return (await response.json()) as T[];
}

/** Inserts one row and returns it as the database stored it. */
export async function npInsert<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const { url, key } = client();
  const response = await fetch(`${url}${REST}${table}`, {
    method: "POST",
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!response.ok) await fout(response);
  const rows = (await response.json()) as T[];
  const inserted = rows[0];
  if (!inserted) throw new NpError("De database gaf geen rij terug.", 502);
  return inserted;
}

// --------------------------------------------------------------- generic REST
// The pulse pipeline reads and writes more shapes than one select and one
// insert: it needs upserts, patches and multi-row inserts. Same credentials and
// the same error mapping as above — only the surface is generic.

/** Alias for the pipeline code, which reads this as "an error from the store". */
export { NpError as SupabaseError };

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** `return=representation` gives the written rows back; the default is minimal. */
  prefer?: string;
};

/**
 * `path` is everything after /rest/v1/, including the query string:
 * `sb("np_questions?select=id,code&enabled=eq.true")`.
 *
 * Anything interpolated into `path` must be url-encoded by the caller — a raw
 * value can otherwise smuggle in its own query parameters.
 */
export async function sb<T>(path: string, options: Options = {}): Promise<T> {
  const { url, key } = client();
  const response = await fetch(url + REST + path, {
    method: options.method ?? "GET",
    headers: headers(key, options.prefer ? { Prefer: options.prefer } : {}),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (!response.ok) await fout(response);
  const text = await response.text();
  // A `return=minimal` write answers 201 with an empty body.
  return (text ? JSON.parse(text) : null) as T;
}

/** Insert rows and get them back. */
export function insert<T>(table: string, rows: unknown[]): Promise<T[]> {
  return sb<T[]>(table, { method: "POST", body: rows, prefer: "return=representation" });
}

/** Insert or update on a conflict target, and get the rows back. */
export function upsert<T>(table: string, rows: unknown[], onConflict: string): Promise<T[]> {
  return sb<T[]>(`${table}?on_conflict=${onConflict}`, {
    method: "POST",
    body: rows,
    prefer: "resolution=merge-duplicates,return=representation",
  });
}
