import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import PWAInit from '@/components/PWAInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HR Management System',
  description: 'Complete HR Management SaaS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
          <link rel='manifest' href='/manifest.json' />
    <meta name='theme-color' content='#0066CC' />
    <meta name='apple-mobile-web-app-capable' content='yes' />
    <meta name='apple-mobile-web-app-status-bar-style' content='default' />
    <meta name='apple-mobile-web-app-title' content='HR System' />
  <body className={inter.className}>
        <QueryProvider>
        <PWAInit />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
