'use client';

import { useModal } from '@/context/ModalContext';
import { AuthModal } from './AuthModal'; // Adjust path if needed

const GlobalModals = () => {
  const { showAuthModal, authError, onAuthSuccess, closeAuthModal } = useModal();

  if (!showAuthModal) return null;

  return (
    <AuthModal
      error={authError}
      onClose={closeAuthModal}
      onSuccess={() => {
        closeAuthModal();
        // if (onAuthSuccess) onAuthSuccess();
         if (typeof onAuthSuccess === 'function') {
  onAuthSuccess();
}
      }}
    />
  );
};

export default GlobalModals;
