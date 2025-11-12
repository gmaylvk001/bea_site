'use client';

import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [onAuthSuccess, setOnAuthSuccess] = useState(null);

  const openAuthModal = (onSuccessCallback, error = '') => {
    setAuthError(error);
    setOnAuthSuccess(() => onSuccessCallback);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError('');
    setOnAuthSuccess(null);
  };

  return (
    <ModalContext.Provider value={{ showAuthModal, authError, openAuthModal, closeAuthModal, onAuthSuccess }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
