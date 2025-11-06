import type { Combatant, DeathSaves } from '../../types';
import CombatantCard from './CombatantCard';

type Props = {
  combatants: Combatant[];
  currentTurn: number;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleConcentration: (id: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
};

export default function CombatantsList({ combatants, currentTurn, onRemove, onDeltaHp, onDeathSaves, onToggleConcentration, onToggleCondition }: Props) {
  return (
    <div className="space-y-4">
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
        />
      ))}
    </div>
  );
}


