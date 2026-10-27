import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastProvider: React.FC = () => {
  const toastOptions = {
    duration: 4000,
    style: {
      background: '#03195B',
      color: '#FFFFFF',
      border: '1px solid #0B2CB1',
      borderRadius: '12px',
      padding: '12px 16px',
    },
    success: {
      style: {
        background: '#03195B',
        border: '1px solid #1951FC',
      },
      iconTheme: {
        primary: '#1951FC',
        secondary: '#000000',
      },
    },
    error: {
      style: {
        background: '#03195B',
        border: '1px solid #5BB8FB',
      },
      iconTheme: {
        primary: '#5BB8FB',
        secondary: '#000000',
      },
    },
    loading: {
      style: {
        background: '#03195B',
        border: '1px solid #5BB8FB',
      },
      iconTheme: {
        primary: '#5BB8FB',
        secondary: '#000000',
      },
    },
  };

  return <Toaster position="top-right" toastOptions={toastOptions} />;
};

export default ToastProvider;