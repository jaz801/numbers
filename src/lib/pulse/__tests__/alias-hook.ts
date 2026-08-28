/**
 * Module resolution for the test run, and nothing else.
 *
 * `node --experimental-strip-types` runs the TypeScript sources as-is, so it
 * sees the two specifier styles the app itself never has to think about: the
 * `@/…` alias that tsconfig defines, and extensionless relative imports. This
 * hook resolves both, so the suite can import the real modules instead of a
 * transpiled copy of them.
 *
 * Loaded via `--import` from the `test` script; it is not test code.
 */

import { statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as nodeModule from "node:module";

type Resolved = { url: string; shortCircuit?: boolean };
type ResolveContext = { parentURL?: string };
type RegisterHooks = (hooks: {
  resolve: (
    specifier: string,
    context: ResolveContext,
    nextResolve: (specifier: string, context: ResolveContext) => Resolved,
  ) => Resolved;
}) => void;

const registerHooks = (nodeModule as unknown as { registerHooks: RegisterHooks }).registerHooks;

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(HERE, "../../..");

/**
 * Modules the unit tests deliberately never execute. insights.ts imports the
 * Supabase and OpenRouter clients at module level; the pure validator under
 * test uses neither, so they resolve to a stub that throws when touched.
 */
const STUBBED = new Set(["@/lib/supabase", "@/lib/openrouter", "server-only"]);

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function firstExisting(base: string): string | null {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

function toFilePath(specifier: string, parentURL: string | undefined): string | null {
  if (STUBBED.has(specifier)) return resolve(HERE, "io-stubs.ts");
  if (specifier.startsWith("@/")) return firstExisting(resolve(SRC_DIR, specifier.slice(2)));
  if (specifier.startsWith(".") && parentURL?.startsWith("file:")) {
    return firstExisting(resolve(dirname(fileURLToPath(parentURL)), specifier));
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const file = toFilePath(specifier, context.parentURL);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
