import type { Metadata } from "next";

type Verification = NonNullable<Metadata["verification"]>;

export function buildSiteVerification(
  google?: string,
  bing?: string
): Verification | undefined {
  const googleToken = google?.trim();
  const bingToken = bing?.trim();
  const verification: Verification = {};
  if (googleToken) verification.google = googleToken;
  if (bingToken) verification.other = { "msvalidate.01": bingToken };
  return verification.google || verification.other ? verification : undefined;
}
