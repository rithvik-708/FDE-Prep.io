import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'FDE Prep Hub | Palantir & AI Startup Command Centre',
  description: 'Shared 12-week Forward Deployed Engineer preparation headquarters.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-zinc-950 text-zinc-50 antialiased selection:bg-emerald-500/30 selection:text-emerald-200 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
