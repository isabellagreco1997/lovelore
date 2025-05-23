import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'LoveLore - Interactive Storytelling',
  description: 'Immerse yourself in interactive romance stories with AI-powered narratives that respond to your choices',
  keywords: 'interactive stories, romance stories, AI storytelling, choose your own adventure, narrative games',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LoveLore - Interactive Storytelling',
    description: 'Immerse yourself in interactive romance stories with AI-powered narratives that respond to your choices',
    url: 'https://lovelore.app',
    siteName: 'LoveLore',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LoveLore - Interactive Storytelling',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoveLore - Interactive Storytelling',
    description: 'Immerse yourself in interactive romance stories with AI-powered narratives that respond to your choices',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon.png" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}