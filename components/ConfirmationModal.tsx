
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-surface-200 overflow-hidden scale-100 animate-in zoom-in-95 duration-200 relative">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
            <AlertTriangle size={28} />
          </div>
          
          <h3 className="text-xl font-sans font-bold text-secondary mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-surface-50 text-gray-700 font-bold rounded-xl hover:bg-surface-100 transition-colors text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-md transition-all transform active:scale-95 text-sm ${
                type === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
