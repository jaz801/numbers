import type { CSSProperties } from "react";

/**
 * Turn a CSS declaration string into a React style object.
 *
 * The portal was designed with plain CSS text in every `style` attribute, and
 * the logic builds styles the same way (`"background:" + kleur`). Parsing at
 * render time keeps those strings as the single source of truth instead of
 * hand-translating hundreds of declarations into camelCase objects.
 */
export function css(decls: string | null | undefined): CSSProperties {
  const out: Record<string, string> = {};
  if (!decls) return out as CSSProperties;
  for (const decl of splitDeclarations(decls)) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;
    out[toCamel(prop)] = value;
  }
  return out as CSSProperties;
}

/** Split on `;`, but not inside a url(), a quoted string, or a nested paren. */
function splitDeclarations(decls: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < decls.length; i++) {
    const ch = decls[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
    } else if (ch === ";" && depth === 0) {
      parts.push(decls.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(decls.slice(start));
  return parts;
}

/** `background-color` -> `backgroundColor`, `-webkit-x` -> `WebkitX`. */
function toCamel(prop: string): string {
  if (prop.startsWith("--")) return prop;
  // A leading vendor dash camelizes along with the rest: `-webkit-x` -> `WebkitX`.
  return prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
