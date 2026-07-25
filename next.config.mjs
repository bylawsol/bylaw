/** @type {import('next').NextConfig} */

// Baseline security headers applied to every route. These are safe with the
// Solana wallet adapter and Next's runtime. A strict Content-Security-Policy is
// intentionally NOT enabled here: it must be authored + tested against real
// wallet connect / RPC flows (see PRODUCTION.md "Security headers"). Enabling an
// untested CSP would risk silently breaking wallet connection.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  webpack: (config) => {
    // Some Solana wallet adapter deps reference node builtins that aren't needed in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    config.externals = config.externals || [];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
