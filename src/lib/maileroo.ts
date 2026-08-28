/**
 * Minimal Maileroo client.
 *
 * Only the one call we need: send a single transactional mail. Maileroo's v2
 * API takes JSON on the sending endpoint and authenticates with an API key
 * header, so there is nothing here worth an SDK dependency.
 */

const ENDPOINT = "https://smtp.maileroo.com/api/v2/emails";

export type Address = { address: string; display_name?: string };

export type SendMailInput = {
  from: Address;
  to: Address[];
  subject: string;
  html: string;
  plain: string;
  replyTo?: Address;
};

export type SendMailResult = { referenceId?: string };

/**
 * Parses `MAILEROO_FROM`, which may be either "user@domain" or
 * "Naam <user@domain>".
 */
export function parseAddress(value: string): Address {
  const match = value.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  if (match) {
    return { address: match[2], display_name: match[1].replace(/^"|"$/g, "") };
  }
  return { address: value.trim() };
}

export async function sendMail(
  input: SendMailInput,
  apiKey: string,
): Promise<SendMailResult> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      subject: input.subject,
      html: input.html,
      plain: input.plain,
    }),
  });

  const raw = await response.text();
  let payload: { success?: boolean; message?: string; data?: { reference_id?: string } } = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    // Non-JSON body: keep the raw text for the error message below.
  }

  if (!response.ok || payload.success === false) {
    throw new Error(
      `Maileroo ${response.status}: ${payload.message ?? raw.slice(0, 400)}`,
    );
  }

  return { referenceId: payload.data?.reference_id };
}
