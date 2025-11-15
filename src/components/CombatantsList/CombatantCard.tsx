import { useEffect, useRef, useState } from 'react';
import type { Combatant, DeathSaves } from '../../types';
import HpBar from './HpBar';
import DeathSavesComp from './DeathSaves';
import ConcentrationToggle from './ConcentrationToggle';
import ConditionsList from './ConditionsList';
import { Shield, Trash2 } from 'lucide-react';
import CombatantAvatar from '../common/CombatantAvatar';
import { HP_BAR_ID_PREFIX } from '../../constants';

type Props = {
  combatant: Combatant;
  isActive: boolean;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleConcentration: (id: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
};

export default function CombatantCard({
  combatant,
  isActive,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleConcentration,
  onToggleCondition,
  onUpdateInitiative
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditingInit, setIsEditingInit] = useState(false);
  const [initValue, setInitValue] = useState(combatant.initiative.toString());
  const isDying = combatant.hp === 0;

  // Scroll into view when this card becomes active
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [isActive]);

  // Auto-select text when entering edit mode
  useEffect(() => {
    if (isEditingInit && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditingInit]);

  // Update local state when combatant initiative changes
  useEffect(() => {
    setInitValue(combatant.initiative.toString());
  }, [combatant.initiative]);

  const handleStartEdit = () => {
    setIsEditingInit(true);
  };

  const handleSave = () => {
    const newInit = parseFloat(initValue);
    if (!isNaN(newInit) && newInit !== combatant.initiative) {
      onUpdateInitiative(combatant.id, newInit);
    } else {
      // Revert to original if invalid or unchanged
      setInitValue(combatant.initiative.toString());
    }
    setIsEditingInit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setInitValue(combatant.initiative.toString());
      setIsEditingInit(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`bg-slate-800 rounded-lg p-4 md:p-6 border-2 transition ${isActive ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-slate-700'
        }`}
      style={{ borderLeftWidth: '6px', borderLeftColor: combatant.color }}
    >
      <div className="flex items-start gap-3 md:gap-4 mb-4">
        <CombatantAvatar
          imageUrl={combatant.imageUrl}
          name={combatant.displayName}
          color={combatant.color}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                {/* Editable Initiative */}
                {isEditingInit ? (
                  <input
                    ref={inputRef}
                    type="number"
                    value={initValue}
                    onChange={(e) => setInitValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-2xl md:text-3xl font-bold text-blue-400 bg-slate-700 border-2 border-blue-500 rounded px-2 w-16 md:w-20 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={handleStartEdit}
                    className="text-2xl md:text-3xl font-bold text-blue-400 cursor-pointer hover:text-blue-300 hover:bg-blue-900/20 rounded px-2 transition-colors select-none"
                    title="Click to edit initiative"
                  >
                    {combatant.initiative}
                  </div>
                )}

                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 truncate">
                  <span className="truncate">{combatant.displayName}</span>
                  {isActive && <span className="text-yellow-500 text-xs md:text-sm flex-shrink-0">(Active)</span>}
                </h3>
              </div>
              <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1 text-xs md:text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: combatant.color }} />
                  <span className="truncate">{combatant.groupName}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Shield className="w-3 h-3 md:w-4 md:h-4" />
                  AC {combatant.ac}
                </div>
                <div className="flex items-center gap-1">
                  <ConcentrationToggle
                    active={combatant.concentration}
                    onToggle={() => onToggleConcentration(combatant.id)}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemove(combatant.id)}
              className="text-red-500 hover:text-red-400 transition flex-shrink-0 p-1"
              title="Remove combatant"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <HpBar
        inputId={`${HP_BAR_ID_PREFIX}${combatant.id}`} 
        hp={combatant.hp} 
        maxHp={combatant.maxHp} 
        isActive={isActive}
        onDelta={(d) => onDeltaHp(combatant.id, d)} 
      />
      {isDying && (
        <DeathSavesComp
          value={combatant.deathSaves}
          onChange={(type, value) => onDeathSaves(combatant.id, type, value)}
        />
      )}
      <ConditionsList
        activeConditions={combatant.conditions}
        onToggle={(c) => onToggleCondition(combatant.id, c)}
      />
    </div>
  );
}