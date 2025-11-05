import type { Combatant, DeathSaves } from '../../types';
import HpBar from './HpBar';
import DeathSavesComp from './DeathSaves';
import ConcentrationToggle from './ConcentrationToggle';
import ConditionsList from './ConditionsList';
import { Shield, Trash2 } from 'lucide-react';

type Props = {
  combatant: Combatant;
  isActive: boolean;
  conditions: string[];
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleConcentration: (id: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
};

export default function CombatantCard({ combatant, isActive, conditions, onRemove, onDeltaHp, onDeathSaves, onToggleConcentration, onToggleCondition }: Props) {
  const isDying = combatant.hp === 0;
  return (
    <div
      className={`bg-slate-800 rounded-lg p-6 border-2 transition ${isActive ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-slate-700'}`}
      style={{ borderLeftWidth: '6px', borderLeftColor: combatant.color }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-blue-400">{combatant.initiative}</div>
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {combatant.displayName}
              {isActive && <span className="text-yellow-500 text-sm">(Active)</span>}
            </h3>
            <div className="flex gap-4 text-sm text-slate-400 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: combatant.color }} />
                {combatant.groupName}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                AC {combatant.ac}
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => onRemove(combatant.id)} className="text-red-500 hover:text-red-400 transition">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <HpBar hp={combatant.hp} maxHp={combatant.maxHp} onDelta={(d) => onDeltaHp(combatant.id, d)} />
      {isDying && (
        <DeathSavesComp value={combatant.deathSaves} onChange={(type, value) => onDeathSaves(combatant.id, type, value)} />
      )}
      <ConcentrationToggle active={combatant.concentration} onToggle={() => onToggleConcentration(combatant.id)} />
      <ConditionsList allConditions={conditions} activeConditions={combatant.conditions} onToggle={(c) => onToggleCondition(combatant.id, c)} />
    </div>
  );
}


