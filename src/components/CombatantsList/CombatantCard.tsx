import { useEffect, useRef } from 'react';
import type { Combatant, DeathSaves } from '../../types';
import HpBar from './HpBar';
import DeathSavesComp from './DeathSaves';
import ConcentrationToggle from './ConcentrationToggle';
import ConditionsList from './ConditionsList';
import { Shield, Trash2 } from 'lucide-react';
import CombatantAvatar from '../common/CombatantAvatar';

type Props = {
  combatant: Combatant;
  isActive: boolean;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleConcentration: (id: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
};

export default function CombatantCard({
  combatant,
  isActive,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleConcentration,
  onToggleCondition
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={cardRef}
      className={`bg-slate-800 rounded-lg p-6 border-2 transition ${isActive ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-slate-700'
        }`}
      style={{ borderLeftWidth: '6px', borderLeftColor: combatant.color }}
    >
      <div className="flex items-start gap-4 mb-4">
        <CombatantAvatar
          imageUrl={combatant.imageUrl}
          name={combatant.displayName}
          color={combatant.color}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="text-3xl font-bold text-blue-400">{combatant.initiative}</div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {combatant.displayName}
                  {isActive && <span className="text-yellow-500 text-sm">(Active)</span>}
                </h3>
              </div>
              <div className="flex gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: combatant.color }} />
                  {combatant.groupName}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
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
              className="text-red-500 hover:text-red-400 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <HpBar hp={combatant.hp} maxHp={combatant.maxHp} onDelta={(d) => onDeltaHp(combatant.id, d)} />
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