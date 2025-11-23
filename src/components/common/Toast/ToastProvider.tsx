import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ToastContext } from "./ToastContext";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration: number;
  onClose?: (id: number) => void;
}

export interface ToastApi {
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
}

const Toast = ({
  id,
  message,
  type,
  duration,
  onClose,
}: Toast) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.(id);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  if (!isVisible) return null;

  const types = {
    success: {
      bg: "bg-green-50 border-green-200",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: "text-green-800",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      text: "text-red-800",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      text: "text-yellow-800",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      text: "text-blue-800",
    },
  };

  const config = types[type] || types.info;

  return (
    <div
      className={`fixed top-4 right-4 max-w-xs w-full shadow-lg rounded-lg border p-4 ${
        config.bg
      } transition-all duration-300 ${
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className={`flex-1 ${config.text} text-sm font-medium`}>
          {message}
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${config.text} hover:opacity-70 transition-opacity`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message: string, duration: number = 3000) =>
      addToast({ message, type: "success", duration }),
    error: (message: string, duration: number  = 3000) =>
      addToast({ message, type: "error", duration }),
    warning: (message: string, duration: number = 3000) =>
      addToast({ message, type: "warning", duration }),
    info: (message: string, duration: number = 3000) =>
      addToast({ message, type: "info", duration }),
  };

  const ToastContainer = ({
    toasts,
    removeToast,
  }: {
    toasts: Toast[];
    removeToast: (id: number) => void;
  }) => {
    return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};
