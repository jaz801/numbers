/**
 * Minimal Supabase (PostgREST) client.
 *
 * Same spirit as maileroo.ts: one small fetch wrapper instead of an SDK. The
 * app has no supabase-js dependency and this does not earn one — every call we
 * make is a plain REST select/insert on a handful of np_ tables.
 *
 * Service role only. Every np_ table has a service_role policy and nothing
 * else, so this module must never be imported from a client component.
 */

const REST = "/rest/v1/";

export class SupabaseError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SupabaseError";
  }
}

/** Throws with a readable message when the environment is half-configured. */
function credentials(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new SupabaseError(
      "SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in de omgeving.",
      503,
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** `return=representation` gives the written rows back; the default is minimal. */
  prefer?: string;
};

/**
 * `path` is everything after /rest/v1/, including the query string:
 * `sb("np_questions?select=id,code&enabled=eq.true")`.
 */
export async function sb<T>(path: string, options: Options = {}): Promise<T> {
  const { url, key } = credentials();
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(url + REST + path, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new SupabaseError(
      `Supabase ${response.status} op ${path}: ${text.slice(0, 400)}`,
      response.status,
    );
  }
  // A `return=minimal` write answers 201 with an empty body.
  return (text ? JSON.parse(text) : null) as T;
}

/** Insert rows and get them back. */
export function insert<T>(table: string, rows: unknown[]): Promise<T[]> {
  return sb<T[]>(table, {
    method: "POST",
    body: rows,
    prefer: "return=representation",
  });
}

/** Insert or update on a conflict target, and get the rows back. */
export function upsert<T>(table: string, rows: unknown[], onConflict: string): Promise<T[]> {
  return sb<T[]>(`${table}?on_conflict=${onConflict}`, {
    method: "POST",
    body: rows,
    prefer: "resolution=merge-duplicates,return=representation",
  });
}
