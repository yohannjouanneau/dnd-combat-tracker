import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Props {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    onClose: () => void
}

export default function Toast({message, type = 'success', duration = 3000, onClose} : Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const types = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      text: 'text-blue-800'
    }
  };

  const config = types[type] || types.info;

  return (
    <div
      className={`fixed top-4 right-4 max-w-md w-full shadow-lg rounded-lg border p-4 ${config.bg} transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
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