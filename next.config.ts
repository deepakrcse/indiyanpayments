import type { NextConfig } from 'next';

/**
 * Indiyan Payments runs as one long-lived Node.js process (`next start`, or the
 * standalone server in `.next/standalone`). Some short-lived state — fetched bills
 * awaiting payment, payment-return tokens, the wallet-owner directory — is kept in
 * process memory, exactly as the previous single-process deployment did. Run a
 * single instance, or swap `src/server/cache` for a shared store before scaling out.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  /**
   * The previous portal's addresses keep working. This matters most for /wallet-settlement:
   * payment links issued before the move send payers back there (with their ?t= token, which a
   * redirect carries over unchanged).
   */
  async redirects() {
    const moved: [string, string][] = [
      ['/wallet-settlement', '/wallet'],
      ['/pg-status', '/payment-status'],
      ['/pg', '/collect/gateway'],
      ['/imps', '/payout/imps'],
      ['/card-payments', '/payout/card-bills'],
      ['/transactions', '/reports/transfers'],
      ['/settings', '/admin/pg-settings'],
      ['/qr-codes', '/admin/qr-codes'],
      ['/qr-requests', '/admin/qr-requests'],
      ['/announcements', '/admin/announcements'],
      ['/customers', '/admin/customers'],
      ['/customers/:path*', '/admin/customers/:path*'],
      ['/reports/admin-business', '/reports/customer-business'],
    ];
    return moved.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
