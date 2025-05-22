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
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenModal = localStorage.getItem('hasSeenSubscriptionModal');
      if (!hasSeenModal) {
        setShowModal(true);
        localStorage.setItem('hasSeenSubscriptionModal', 'true');
      }
    }
  }, [user]);

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