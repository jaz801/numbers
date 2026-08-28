/**
 * The public invite page. Nothing is fetched here: the token is the only
 * identity, and the answers are private to the browser that gives them, so the
 * page stays a thin server shell around a client form that talks to
 * /api/vragen/{token} itself.
 */

import PulseForm from "./form";

export const metadata = {
  title: "namber · jouw pulse",
  robots: { index: false, follow: false },
};

export default async function VragenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PulseForm token={token} />;
}
