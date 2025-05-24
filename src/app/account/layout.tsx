import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings | LoveLore',
  description: 'Manage your LoveLore account settings, subscription, and profile. Update your preferences and control your interactive storytelling experience.',
  keywords: 'account settings, profile, subscription, user preferences, account management',
  robots: {
    index: false, // Don't index account pages for privacy
    follow: false, // Don't follow links from account pages
    noarchive: true, // Don't cache these pages
    nosnippet: true, // Don't show snippets in search results
  },
  openGraph: {
    title: 'Account Settings | LoveLore',
    description: 'Manage your LoveLore account settings, subscription, and profile.',
    url: '/account',
    type: 'website',
  },
  alternates: {
    canonical: '/account',
  },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 