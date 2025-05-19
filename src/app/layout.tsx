import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import useStripeSync from '@/hooks/useStripeSync';

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
  // Add Stripe sync hook
  useStripeSync();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/svg+xml" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}