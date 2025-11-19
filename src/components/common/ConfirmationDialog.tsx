import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
};

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'danger',
}: Props) {
  const { t } = useTranslation(["common"]);

  if (!isOpen) return null;

  const confirmButtonClass = variant === 'danger' 
    ? 'bg-red-600 hover:bg-red-700' 
    : 'bg-orange-600 hover:bg-orange-700';

    const confirm = confirmText ?? t("common:confirmation.confirm")
    const cancel = cancelText ?? t("common:confirmation.cancel")
    

  return (
    <>
      {/* Backdrop */}
      <div className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onCancel}/>

      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-slate-300">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-4 border-t border-slate-700">
            <button
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition"
            >
              {cancel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 ${confirmButtonClass} text-white px-4 py-2 rounded transition`}
            >
              {confirm}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}