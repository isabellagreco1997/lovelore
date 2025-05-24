import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center | LoveLore',
  description: 'Get help and support for LoveLore. Find answers to frequently asked questions, troubleshooting guides, and learn how to get the most out of your interactive storytelling experience.',
  keywords: 'help, support, FAQ, troubleshooting, customer service, user guide, how to',
  openGraph: {
    title: 'Help Center | LoveLore',
    description: 'Get help and support for LoveLore. Find answers to frequently asked questions and troubleshooting guides.',
    url: '/help',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Help Center | LoveLore',
    description: 'Get help and support for LoveLore. Find answers to frequently asked questions and troubleshooting guides.',
  },
  alternates: {
    canonical: '/help',
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 