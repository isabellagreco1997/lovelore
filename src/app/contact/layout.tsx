import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | LoveLore',
  description: 'Get in touch with the LoveLore team. Contact us for support, feedback, partnerships, or any questions about our interactive romance storytelling platform.',
  keywords: 'contact, support, feedback, customer service, get in touch, email, contact form',
  openGraph: {
    title: 'Contact Us | LoveLore',
    description: 'Get in touch with the LoveLore team. Contact us for support, feedback, partnerships, or any questions.',
    url: '/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us | LoveLore',
    description: 'Get in touch with the LoveLore team. Contact us for support, feedback, partnerships, or any questions.',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 