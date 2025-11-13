import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

type Props = {
  inputId: string;
  hp: number;
  maxHp: number;
  isActive?: boolean;
  onDelta: (delta: number) => void;
};

export default function HpBar({inputId, hp, maxHp, isActive, onDelta }: Props) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = (hp / maxHp) * 100;

  // Auto-focus input when combatant becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleApply = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value !== 0) {
      onDelta(value);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{hp} / {maxHp} HP</span>
        </div>
        <div className="flex gap-2 items-center">
          <input
            id={inputId}
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="±0"
            className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none w-24 text-center"
          />
          <button 
            onClick={handleApply}
            disabled={!inputValue}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-3 rounded transition flex items-center gap-1"
            title="Apply HP change"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}