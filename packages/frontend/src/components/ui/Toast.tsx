// packages/frontend/src/components/ui/Toast.tsx

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#1951FC]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#5BB8FB]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#3781FC]" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#5BB8FB]" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'border-[#1951FC]/30 bg-[#1951FC]/10';
      case 'error':
        return 'border-[#5BB8FB]/30 bg-[#5BB8FB]/10';
      case 'warning':
        return 'border-[#3781FC]/30 bg-[#3781FC]/10';
      case 'info':
      default:
        return 'border-[#5BB8FB]/30 bg-[#5BB8FB]/10';
    }
  };

  return (
    <div className={`max-w-sm w-full p-4 rounded-xl border ${getBgColor()} shadow-xl animate-in slide-in-from-top-4 duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#FFFFFF]">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-[#5BB8FB] hover:text-[#FFFFFF] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Toast Container
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastIdCounter = 0;
let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

export const addToast = (message: string, type: ToastType = 'info', duration?: number) => {
  const id = String(++toastIdCounter);
  const newToast: ToastItem = { id, message, type, duration };
  toasts = [...toasts, newToast];
  toastListeners.forEach(listener => listener(toasts));
};

export const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id);
  toastListeners.forEach(listener => listener(toasts));
};

export const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setItems);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2">
      {items.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};