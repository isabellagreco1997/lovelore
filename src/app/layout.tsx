import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LoveLore - Interactive Storytelling',
  description: 'Immerse yourself in interactive love stories',
  icons: {
    icon: [
      { url: '/images/favicon.png', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/images/favicon.png', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/svg+xml" />
      </head>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}