import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Manrope } from 'next/font/google';
import { site } from '@/config/site';
import { Providers } from './providers';
import './globals.css';

// Type system: Geist for everything you read, Manrope for headings and money (geometric, rich,
// with tabular figures), Geist Mono for references — IDs, UTRs, account numbers.
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#022C71',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${geist.variable} ${manrope.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
