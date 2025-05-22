'use client';

import { ReactNode, useState, useEffect } from 'react';
import useStripeSync from '@/hooks/useStripeSync';
import useUser from '@/hooks/useUser';
import SubscriptionModal from './SubscriptionModal';

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  useStripeSync();
  const { user, loading } = useUser();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only check for modal after authentication is complete
    if (!loading && user) {
      const hasSeenModal = localStorage.getItem('hasSeenSubscriptionModal');
      if (!hasSeenModal) {
        // Add a small delay to ensure smooth transition
        const timer = setTimeout(() => {
          setShowModal(true);
          localStorage.setItem('hasSeenSubscriptionModal', 'true');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading]);

  return (
    <>
      {children}
      <SubscriptionModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};

export default ClientLayout;