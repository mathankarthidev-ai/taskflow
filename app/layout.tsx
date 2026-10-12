import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskFlow | Production Task Management SaaS',
  description: 'Enterprise internal task management platform built with Next.js 15, React 19, TypeScript, and Supabase PostgreSQL.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var c = localStorage.getItem('ambizcon_selected_company');
                  if (c === 'Ambizcon') {
                    document.documentElement.setAttribute('data-company', 'ambizcon');
                  } else {
                    document.documentElement.setAttribute('data-company', 'ambizcon-health');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
