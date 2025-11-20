import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationToastProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    warning: <AlertCircle size={20} className="text-amber-500" />,
    info: <Info size={20} className="text-blue-500" />,
  };

  const styles = {
    success: 'border-green-100 bg-white',
    warning: 'border-amber-100 bg-white',
    info: 'border-blue-100 bg-white',
  };

  return (
    <div className={`
      pointer-events-auto flex items-center gap-3 p-4 rounded-xl border shadow-lg shadow-gray-100 
      min-w-[300px] max-w-md animate-in slide-in-from-right-full duration-300 bg-white
      ${styles[toast.type]}
    `}>
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-700">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationToast;