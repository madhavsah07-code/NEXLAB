// packages/frontend/src/components/ui/ConfirmDialog.tsx

import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export type ConfirmDialogType = 'info' | 'warning' | 'danger' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-[#F87171]" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-[#FBBF24]" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-[#10B981]" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-[#60A5FA]" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#F87171] hover:bg-[#F87171]/80 focus:ring-[#F87171] text-white';
      case 'warning':
        return 'bg-[#FBBF24] hover:bg-[#FBBF24]/80 focus:ring-[#FBBF24] text-[#0D0F0F]';
      case 'success':
        return 'bg-[#10B981] hover:bg-[#34D399] focus:ring-[#10B981]';
      case 'info':
      default:
        return 'bg-[#60A5FA] hover:bg-[#60A5FA]/80 focus:ring-[#60A5FA]';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0D0F0F]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A302E]">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-[#EDEFEE]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#5C6360] hover:text-[#EDEFEE] hover:bg-[#1E2322] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[#9CA3A0] text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0 border-t border-[#2A302E]">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${getButtonColor()} ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2" />
                Loading...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;