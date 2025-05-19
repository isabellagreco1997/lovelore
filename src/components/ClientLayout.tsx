'use client';

import { ReactNode } from 'react';
import useStripeSync from '@/hooks/useStripeSync';

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  useStripeSync();
  return <>{children}</>;
};

export default ClientLayout;