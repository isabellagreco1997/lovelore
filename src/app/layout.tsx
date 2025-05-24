import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
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
  title: 'Lovelore - AI Love Stories',
  description: 'Experience interactive romance stories where AI brings your choices to life. Fall in love, choose your path, and shape your story.',
  keywords: 'ai love, ai boyfriends, ai love stories, interactive stories, romance stories, AI storytelling, choose your own adventure, narrative games',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Lovelore - AI Love Stories',
    description: 'Experience interactive romance stories where AI brings your choices to life. Fall in love, choose your path, and shape your story.',
    url: 'https://lovelore.app',
    siteName: 'LoveLore',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Lovelore - Interactive Storytelling',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title:'Lovelore - AI Love Stories',
    description: 'Experience interactive romance stories where AI brings your choices to life. Fall in love, choose your path, and shape your story.',
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
        <Analytics />
      </body>
    </html>
  );
}