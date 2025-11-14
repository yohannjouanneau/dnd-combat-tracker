import { Eye, EyeOff } from 'lucide-react';

type Props = {
  isFocusMode: boolean;
  onToggle: () => void;
};

export default function FocusModeToggle({ isFocusMode, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`bg-slate-800 rounded-lg px-4 py-4 border border-slate-700 flex items-center justify-center transition hover:bg-slate-700 ${
        isFocusMode ? 'text-amber-400' : 'text-purple-400'
      }`}
      title={`${isFocusMode ? 'Exit' : 'Enter'} Focus Mode (F key)`}
    >
      {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </button>
  );
}