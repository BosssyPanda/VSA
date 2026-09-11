import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Month End talks to nothing. There is no account system, no database, no
 * analytics and no third-party script: a run lives in localStorage and the only
 * network traffic after first load is the browser fetching its own assets. That
 * makes `connect-src 'self'` a statement of fact rather than a restriction, and it
 * is the directive that matters most here — it is what stops an injected script
 * from posting a player's answers anywhere.
 *
 * There is no `script-src`, for the same reason LifePatch had none: policing script
 * execution needs a per-request nonce, which forces every route dynamic. This app
 * renders no user-supplied markup (no rich text, no chat, no profile, no
 * `dangerouslySetInnerHTML`), so there is no known injection vector for it to stand
 * behind. Revisit the day any free-text field reaches another person's screen.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "connect-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
