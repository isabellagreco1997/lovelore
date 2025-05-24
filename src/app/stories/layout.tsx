import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Romance Stories | LoveLore',
  description: 'Browse our collection of AI-powered interactive romance stories. Choose your path, make decisions, and shape your romantic destiny in immersive narratives.',
  keywords: 'interactive stories, romance stories, AI stories, choose your adventure, love stories, dating sim, visual novel, interactive fiction',
  openGraph: {
    title: 'Interactive Romance Stories | LoveLore',
    description: 'Browse our collection of AI-powered interactive romance stories. Choose your path, make decisions, and shape your romantic destiny.',
    url: '/stories',
    type: 'website',
    images: [
      {
        url: '/images/og-stories.jpg',
        width: 1200,
        height: 630,
        alt: 'LoveLore Stories Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Romance Stories | LoveLore',
    description: 'Browse our collection of AI-powered interactive romance stories. Choose your path, make decisions, and shape your romantic destiny.',
    images: ['/images/og-stories.jpg'],
  },
  alternates: {
    canonical: '/stories',
  },
};

export default function StoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 