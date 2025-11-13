import type { RefObject } from 'react';
import type { Combatant, DeathSaves } from '../../types';
import CombatantCard from './CombatantCard';

type Props = {
  combatListRef: RefObject<HTMLDivElement | null>;
  combatants: Combatant[];
  currentTurn: number;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleConcentration: (id: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
};

export default function CombatantsList({ combatListRef, combatants, currentTurn, onRemove, onDeltaHp, onDeathSaves, onToggleConcentration, onToggleCondition, onUpdateInitiative }: Props) {
  return (
    <div
      className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
      ref={combatListRef}
    >
      {combatants.map((c, index) => (
        <CombatantCard
          key={c.id}
          combatant={c}
          isActive={index === currentTurn}
          onRemove={onRemove}
          onDeltaHp={onDeltaHp}
          onDeathSaves={onDeathSaves}
          onToggleConcentration={onToggleConcentration}
          onToggleCondition={onToggleCondition}
          onUpdateInitiative={onUpdateInitiative}
        />
      ))}
    </div>
  );
}