/**
 * The shared shell for every Namber pulse mail.
 *
 * Inbox HTML is not web HTML: tables instead of flexbox, inline styles instead
 * of classes, and no webfonts you can rely on. Everything here is deliberately
 * boring so it survives Outlook as well as Gmail.
 */

export const brand = {
  primary: "#00B0A8",
  secondary: "#27CFC3",
  accent: "#F5A46C",
  ink: "#1F1F1F",
  muted: "#5B5B5B",
  hairline: "#E4E4E4",
  canvas: "#F6F6F4",
  white: "#FFFFFF",
  font: '"Work Sans", "Inter", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  logo: "https://namber.nl/wp-content/uploads/logo-namber.svg",
  site: "https://namber.nl",
} as const;

/** Escapes text that gets interpolated into the HTML body. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function button(label: string, href: string): string {
  return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
        <tr>
          <td align="center" bgcolor="${brand.accent}" style="border-radius:200px;">
            <a href="${esc(href)}"
               style="display:inline-block;padding:14px 34px;font-family:${brand.font};font-size:17px;font-weight:600;color:${brand.white};text-decoration:none;border-radius:200px;">
              ${esc(label)}
            </a>
          </td>
        </tr>
      </table>`;
}

/** A numbered statement in the 1-5 scale list. */
export function question(index: number, text: string, hint?: string): string {
  return `
        <tr>
          <td width="34" valign="top" style="font-family:${brand.font};font-size:17px;line-height:26px;color:${brand.primary};font-weight:600;padding:6px 0;">${index}.</td>
          <td valign="top" style="font-family:${brand.font};font-size:17px;line-height:26px;color:${brand.ink};padding:6px 0;">
            ${esc(text)}${hint ? `<br><span style="font-size:15px;color:${brand.muted};">${esc(hint)}</span>` : ""}
          </td>
        </tr>`;
}

export function questionList(rows: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 8px;">${rows}
      </table>`;
}

export function sectionLabel(text: string, note?: string): string {
  return `
      <p style="margin:26px 0 2px;font-family:${brand.font};font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:${brand.primary};font-weight:600;">${esc(text)}</p>
      ${note ? `<p style="margin:0 0 6px;font-family:${brand.font};font-size:14px;line-height:22px;color:${brand.muted};">${esc(note)}</p>` : ""}`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${brand.font};font-size:17px;line-height:27px;color:${brand.ink};">${text}</p>`;
}

/** Wraps body HTML in the branded envelope: header, card, footer. */
export function layout(options: {
  preheader: string;
  body: string;
  unsubscribeUrl?: string;
}): string {
  const { preheader, body, unsubscribeUrl } = options;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${brand.canvas}" style="background:${brand.canvas};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <span style="display:none;font-size:1px;color:${brand.canvas};max-height:0;overflow:hidden;">${esc(preheader)}</span>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:0 8px 20px;">
            <a href="${brand.site}" style="text-decoration:none;font-family:${brand.font};font-size:22px;font-weight:700;color:${brand.primary};letter-spacing:-0.3px;">Namber</a>
            <span style="font-family:${brand.font};font-size:14px;color:${brand.muted};padding-left:10px;">Welzijnspulse</span>
          </td>
        </tr>
        <tr>
          <td bgcolor="${brand.white}" style="background:${brand.white};border-radius:5px;border-top:4px solid ${brand.primary};padding:36px 34px 30px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 8px 0;font-family:${brand.font};font-size:13px;line-height:21px;color:${brand.muted};">
            <p style="margin:0 0 6px;">Goed met cijfers, goed voor mensen.</p>
            <p style="margin:0 0 6px;">Namber · Hoge der A 26, 9712 AE Groningen · <a href="mailto:info@namber.nl" style="color:${brand.muted};">info@namber.nl</a></p>
            ${unsubscribeUrl ? `<p style="margin:0;"><a href="${esc(unsubscribeUrl)}" style="color:${brand.muted};">Geen pulse-mails meer ontvangen</a></p>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}
