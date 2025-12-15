import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  inputId: string;
  hp: number;
  maxHp: number;
  isActive?: boolean;
  onDelta: (delta: number) => void;
};

export default function HpBar({inputId, hp, maxHp, isActive, onDelta }: Props) {
  const { t } = useTranslation('combat');
  const [inputValue, setInputValue] = useState('');
  const [showQuickButtons, setShowQuickButtons] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = (hp / maxHp) * 100;

  // Auto-focus input when combatant becomes active (desktop only)
  useEffect(() => {
    if (isActive && inputRef.current && window.innerWidth >= 768) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Auto-expand quick buttons when combatant becomes active (mobile only)
  useEffect(() => {
    if (isActive && window.innerWidth < 768) {
      setShowQuickButtons(true);
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

  const handleQuickDelta = (delta: number) => {
    onDelta(delta);
  };

  const quickValues = [-10, -5, -1, +1, +5, +10];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-text-primary">
          {hp} / {maxHp} {t('combat:combatant.hp')}
        </span>
        
        <button
          onClick={() => setShowQuickButtons(!showQuickButtons)}
          className="md:hidden text-purple-400 hover:text-purple-300 transition flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-panel-secondary"
        >
          {showQuickButtons ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {t('combat:hpBar.quick')}
        </button>
      </div>

      {/* HP Progress Bar */}
      <div className="w-full bg-panel-secondary rounded-full h-3 overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Collapsible Quick Buttons - Mobile/Tablet only */}
      <div 
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          maxHeight: showQuickButtons ? '120px' : '0px',
          opacity: showQuickButtons ? 1 : 0
        }}
      >
        <div className="grid grid-cols-3 gap-2 mb-3">
          {quickValues.map(val => (
            <button
              key={val}
              onClick={() => handleQuickDelta(val)}
              className={`py-2 rounded font-bold text-base transition active:scale-95 ${
                val < 0 
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white' 
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
              }`}
            >
              {val > 0 ? '+' : ''}{val}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input - Always visible */}
      <div className="flex gap-2 items-center">
        <input
          id={inputId}
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={t('combat:hpBar.placeholder')}
          className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none w-24 text-center"
        />
        <button 
          onClick={handleApply}
          disabled={!inputValue}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-panel-secondary disabled:cursor-not-allowed text-white px-3 py-3 rounded transition flex items-center gap-1"
          title={t('combat:hpBar.apply')}
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}