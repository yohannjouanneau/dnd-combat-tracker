import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

type Props = {
  hp: number;
  maxHp: number;
  onDelta: (delta: number) => void;
};

export default function HpBar({ hp, maxHp, onDelta }: Props) {
  const [inputValue, setInputValue] = useState('');
  const pct = (hp / maxHp) * 100;

  const handleApplyDamage = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value !== 0) {
      onDelta(-value);
      setInputValue('');
    }
  };

  const handleApplyHealing = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value !== 0) {
      onDelta(value);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Default to damage if no specific action is indicated
      handleApplyDamage();
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{hp} / {maxHp} HP</span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleApplyDamage}
            disabled={!inputValue}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-3 rounded transition flex items-center gap-1"
            title="Apply damage"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="0"
            className="bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none w-20 text-center"
          />
          <button
            onClick={handleApplyHealing}
            disabled={!inputValue}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-3 rounded transition flex items-center gap-1"
            title="Apply healing"
          >
            <Plus className="w-4 h-4" />
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