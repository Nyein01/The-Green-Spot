
import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000); // Auto dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div 
      className={`
        pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-md animate-slide-up transition-all duration-300 transform hover:scale-105
        ${toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-800 dark:bg-amber-900/80 dark:border-amber-700 dark:text-amber-100' : ''}
        ${toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/80 dark:border-red-700 dark:text-red-100' : ''}
        ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/80 dark:border-green-700 dark:text-green-100' : ''}
        ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800 dark:bg-blue-900/80 dark:border-blue-700 dark:text-blue-100' : ''}
      `}
      role="alert"
    >
      <div className="mr-3 mt-0.5">
        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
        {toast.type === 'error' && <Bell className="w-5 h-5 animate-pulse" />}
        {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
        {toast.type === 'info' && <Info className="w-5 h-5" />}
      </div>
      <div className="flex-1 mr-2">
         <h4 className="font-bold text-sm uppercase tracking-wide opacity-90 mb-0.5">
             {toast.type === 'warning' ? 'Low Stock Alert' : toast.type}
         </h4>
         <p className="text-sm font-medium leading-tight">{toast.message}</p>
      </div>
      <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100 p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
