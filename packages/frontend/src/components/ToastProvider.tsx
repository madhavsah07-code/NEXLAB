import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastProvider: React.FC = () => {
  const toastOptions = {
    duration: 4000,
    style: {
      background: '#161A19',
      color: '#EDEFEE',
      border: '1px solid #2A302E',
      borderRadius: '12px',
      padding: '12px 16px',
    },
    success: {
      style: {
        background: '#161A19',
        border: '1px solid #10B981',
      },
      iconTheme: {
        primary: '#10B981',
        secondary: '#0D0F0F',
      },
    },
    error: {
      style: {
        background: '#161A19',
        border: '1px solid #F87171',
      },
      iconTheme: {
        primary: '#F87171',
        secondary: '#0D0F0F',
      },
    },
    loading: {
      style: {
        background: '#161A19',
        border: '1px solid #60A5FA',
      },
      iconTheme: {
        primary: '#60A5FA',
        secondary: '#0D0F0F',
      },
    },
  };

  return <Toaster position="top-right" toastOptions={toastOptions} />;
};

export default ToastProvider;